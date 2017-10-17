require.config({
  packages: [{
    name: "diff_match_patch",
    location: "//cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119",
    main: "diff_match_patch"
  }]
});

define([
    'base/js/namespace',
    'jquery',
    'require',
    'base/js/events',
    'base/js/dialog',
    'services/config',
    'base/js/utils',
    'notebook/js/codecell',
    'notebook/js/outputarea',
    'codemirror/lib/codemirror',
    'codemirror/addon/merge/merge',
    'codemirror/addon/search/searchcursor',
    'codemirror/addon/scroll/annotatescrollbar',
    'codemirror/addon/search/matchesonscrollbar'
], function(Jupyter, $, require, events, jsdialog, configmod, utils, codecell, outputarea, codemirror,
    merge, searchcursor, annotatescrollbar, matchesonscrollbar) {
    "use strict";

    var mod_name = 'MultiOutputs';
    var log_prefix = '[' + mod_name + ']';

    // defaults, overridden by server's config
    var options = {
        max_num_of_pinned_outputs: 5
    };

    function changeColor(first, cell, msg){
        var outback = cell.output_area.wrapper.find('.out_prompt_bg');
        var inback = $(cell.input[0].firstChild);

        cell.element.removeClass('cell-status-success');
        cell.element.removeClass('cell-status-error');
        cell.element.removeClass('cell-status-inqueue');

        if(first == true) {
            cell.element.addClass('cell-status-inqueue');
        } else {
            if (msg.content.status != "ok" && msg.content.status != "aborted") {
                cell.element.addClass('cell-status-error');
            } else if (msg.content.status != "aborted") {
                cell.element.addClass('cell-status-success');
            }
        }
    }

    function init_events() {
        events.on('create.Cell', function (e, data) {
            if (data.cell instanceof codecell.CodeCell) {
                setTimeout(function() {
                    extend_cell(data.cell);
                }, 0);
            }
        });
    }

    function extend_cell(cell) {
        var pinned_outputs = cell.metadata.pinned_outputs;
        if(pinned_outputs === undefined) {
            pinned_outputs = [];
        }
        if(cell.pinned_outputs === undefined) {
            cell.pinned_outputs = [];
        }

        if(pinned_outputs.length > 0) {
            create_multi_output_tabs(cell)
            for(var i=0; i<pinned_outputs.length; ++i) {
                add_tab_outputarea(cell, pinned_outputs[i]);
            }
        }

        extend_prompt(cell, cell.output_area);
        create_pin_button(cell, cell.output_area);
        update_pin_button_status(cell.output_area);
    }

    function create_multi_output_tabs(cell)
    {
        var container = $('<div/>')
            .addClass('multi-output-container');
        var tabbar = $('<div/>')
            .addClass('multi-output-tabs')
            .addClass('output_area')
            .append($('<div/>')
                    .addClass('out_prompt_bg').addClass('prompt'))
            .appendTo(container);
        var tabs = $('<ul/>')
            .addClass('nav')
            .addClass('nav-tabs')
            .appendTo(tabbar);

        container.insertAfter(cell.element.find('.input'));

        tabs.append(
            $('<li/>')
                .attr('id', 'tab-output-current')
                .append(
                    $('<a/>').attr( { href: '#output-current'}).text('*')))

        var tab_output_wrapper = $('<div/>')
            .addClass('multi-output-wrapper')
            .attr('id', 'output-current');

        tab_output_wrapper.insertAfter(cell.element.find('div.multi-output-tabs'));
        cell.output_area.wrapper.appendTo(tab_output_wrapper);

        container.tabs();
    }

    function remove_multi_output_tabs(cell)
    {
        var container = cell.element.find('.multi-output-container');

        container.tabs("destroy");
        cell.output_area.wrapper.insertAfter(cell.element.find('.input'));
        container.remove();
    }

    function add_tab_outputarea(cell, pinned_output_data)
    {
        var pinned_output_element = $('<div></div>')
        var pinned_outputarea = new outputarea.OutputArea({
            config: cell.config,
            selector: pinned_output_element,
            prompt_area: true,
            events: cell.events,
            keyboard_manager: cell.keyboard_manager,
        });
        var pinned_output = {
            execution_count: pinned_output_data.execution_count,
            outputarea: pinned_outputarea,
            data: pinned_output_data
        }

        var tab_container = cell.element.find('div.multi-output-container');
        var tab_id = 'output-' + Date.now();
        var tab_wrapper = $('<div/>')
            .addClass('multi-output-wrapper')
            .attr('id', tab_id)
            .append(pinned_output_element)
            .appendTo(tab_container);

        pinned_outputarea.tab_id = tab_id;
        cell.pinned_outputs.push(pinned_outputarea);

        pinned_outputarea.trusted = cell.metadata.trusted || false;
        pinned_outputarea.fromJSON(pinned_output_data.outputs);

        extend_prompt(cell, pinned_outputarea);

        create_diff_button(cell, pinned_output);

        var tab = create_tab(cell, pinned_output, tab_id);
        tab.insertAfter(cell.element.find('div.multi-output-tabs ul.nav-tabs li#tab-output-current'));

        setTimeout(function() {
            tab_container.tabs('refresh');
        }, 0);

        return tab;
    }

    function create_tab(cell, pinned_output, id)
    {
        var title = 'Out [' + pinned_output.execution_count + ']';
        var tab = $('<li/>')
            .attr('id', 'tab-' + id)
            .append($('<button/>')
                    .button({
                        icons: { primary: 'ui-icon-circle-close' },
                        text: null
                    })
                    .on('click', function() {
                        remove_pinned_output(cell, pinned_output.outputarea);
                    })).append($('<a/>').attr( { href: '#' + id }).text(title))
        return tab;
    }

    function extend_prompt(cell, output_area)
    {
        $('<div/>')
            .addClass('out_prompt_bg')
            .addClass('prompt')
            .appendTo(output_area.wrapper);
    }

    function create_pin_button(cell, output_area)
    {
        var container = $('<div/>')
                    .addClass('multi-outputs-ui')
                    .appendTo(output_area.wrapper.find('.out_prompt_overlay'));

        var btn = $('<div/>')
                    .addClass('buttons')
                    .append('<button class="btn btn-default"/>')
                    .appendTo(container);

        var clickable = btn.find('button');
        $('<i class="fa fa-fw fa-thumb-tack"/>').appendTo(clickable);
        clickable.on('click', function (event) {
            pin_output(cell);
            return false;
        });
    }

    function create_diff_button(cell, pinned_output) {
        var output_area = pinned_output.outputarea;
        var container = $('<div/>')
                    .addClass('multi-outputs-diff-ui')
                    .appendTo(output_area.wrapper.find('.out_prompt_overlay'));

        var btn = $('<div/>')
                    .addClass('buttons')
                    .append('<button class="btn btn-default"/>')
                    .appendTo(container);

        var clickable = btn.find('button');
        $('<i class="fa fa-fw fa-exchange"/>').appendTo(clickable);
        clickable.on('click', function (event) {
            show_diff_dialog(cell, pinned_output);
            return false;
        });
    }

    function update_pin_button_status(output_area) {
        if(output_area.outputs.length == 0) {
            output_area.wrapper.find('.multi-outputs-ui').css('display', 'none');
        } else {
            output_area.wrapper.find('.multi-outputs-ui').css('display', '');
        }
    }

    function pin_output(cell) {
        if(cell.output_area.outputs.length == 0) {
            return;
        }

        if(cell.input_prompt_number === '*') {
            return;
        }

        if(cell.metadata.pinned_outputs === undefined) {
            cell.metadata.pinned_outputs = [];
        }

        var outputs_json = cell.output_area.toJSON();
        var pinned_output = {
            'execution_count': cell.input_prompt_number,
            'outputs' : outputs_json
        }
        cell.metadata.pinned_outputs.push(pinned_output);

        if(cell.pinned_outputs.length == 0) {
            create_multi_output_tabs(cell);
        }
        var tab = add_tab_outputarea(cell, pinned_output);
        var anchor = tab.find('a');
        setTimeout(function() {
            anchor.click();
        }, 0);

        remove_old_pinned_outputs(cell);

        update_pin_button_status(cell.output_area);

        cell.events.trigger('set_dirty.Notebook', {value: true});
    }

    function remove_old_pinned_outputs(cell) {
        var pinned_output_areas = cell.pinned_outputs;

        var max = Math.max(options.max_num_of_pinned_outputs, 1);
        while(pinned_output_areas.length > max) {
            remove_pinned_output(cell,
                                 pinned_output_areas[0],
                                 pinned_output_areas[0].tab_id)
        }
    }

    function remove_pinned_output(cell, pinned_output_area) {
        cell.pinned_outputs.splice(
            cell.pinned_outputs.indexOf(pinned_output_area), 1);
        cell.metadata.pinned_outputs.splice(
            cell.metadata.pinned_outputs.indexOf(pinned_output_area.data), 1);

        var tab_id = pinned_output_area.tab_id;
        cell.element.find('ul > li#tab-' + tab_id).remove();
        cell.element.find('div#' + tab_id ).remove();
        cell.element.find('div.multi-output-container').tabs('refresh');

        if(cell.pinned_outputs.length == 0) {
            remove_multi_output_tabs(cell);
        }

        cell.events.trigger('set_dirty.Notebook', {value: true});
    }

    function get_output_text(output_area) {
        var outputs = output_area.outputs;
        var texts = new Array();
        for(var i=0; i < outputs.length; ++i) {
            if (outputs[i].data && outputs[i].data['text/plain']) {
                texts.push(outputs[i].data['text/plain']);
            } else if (outputs[i].output_type == 'stream') {
                texts.push(outputs[i].text);
            } else if (outputs[i].output_type == 'error') {
                texts.push(outputs[i].traceback.join('\n'));
            }
        }
        return texts.join('\n');
    }

    function mark_text(editor, query, searchCursor)
    {
        var searchCursor = editor.getSearchCursor(query, 0, false);

        var marks = editor.getAllMarks();
        for (var i=0; i<marks.length; ++i) {
            marks[i].clear();
        }
        if(editor.scrollBarAnnotation) {
            editor.scrollBarAnnotation.clear();
        }

        var options = {className: 'search-highlight'};
        while(searchCursor.findNext()) {
            editor.markText(
                searchCursor.from(), searchCursor.to(),
                options);
        }
        editor.scrollBarAnnotation = editor.showMatchesOnScrollbar(query, false, options);
    }

    function show_diff_dialog(cell, pinned_output) {
        var value = get_output_text(cell.output_area);
        var orig = get_output_text(pinned_output.outputarea);
        if(value === "" && orig === "") {
            return;
        }

        var number = cell.input_prompt_number;
        var orig_number = pinned_output.execution_count;

        var dv;
        var content = $('<div/>').addClass('multi-outputs-diff');
        var searchbar = $('<div/>').addClass('multi-outputs-search-bar');
        $('<span/>').addClass('label').text('Search').appendTo(searchbar);
        var input = $('<input/>').attr('type', 'text').appendTo(searchbar);
        input.keydown(function(event, ui) {
            event.stopPropagation();
            return true;
        });
        input.change(function(event, ui) {
            var text = input.val();
            mark_text(dv.edit, text);
            mark_text(dv.right.orig, text);
        });

        var dialogResized = function (event, ui) {
            content.css('width', '');
            var dialog = content.parent();
            var titlebar = dialog.find('.ui-dialog-titlebar');
            var height = dialog.height() - titlebar.outerHeight();
            content.css('height', height + 'px');
            var merge = content.find('.CodeMirror-merge');
            var mergeHeight = content.height() - searchbar.outerHeight();
            merge.css('height', mergeHeight + 'px');
            dv.edit.setSize(null, merge.height() + 'px');
            dv.right.orig.setSize(null, merge.height() + 'px');
            dv.right.forceUpdate();
        }

        content.dialog({
            open: function(event, ui) {
                dv = codemirror.MergeView(content.get(0), {
                    value: value,
                    orig: orig,
                    lineNumbers: true,
                    mode: "text/plain",
                    highlightDifferences: true,
                    revertButtons: false,
                    lineWrapping: true
                });
                searchbar.appendTo(content);
                dialogResized();
            },
            close: function(event, ui) {
                content.dialog("destroy");
            },
            resize: dialogResized,
            resizeStop: dialogResized,
            title: "Diff: Out[" + number + "] <- Out[" + orig_number + "]",
            minWidth: 500,
            minHeight: 400,
            width: 500,
            height: 400,
        });
    }

    /* Load additional CSS */
    var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name, 'css');
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    var load_extension = function() {
        load_css('./main.css');
        load_css('codemirror/addon/merge/merge.css');
        load_css('codemirror/addon/search/matchesonscrollbar.css');
    };

    function patch_CodeCell_get_callbacks() {
        console.log('[multi_outputs] patching CodeCell.prototype.get_callbacks');
        var previous_get_callbacks = codecell.CodeCell.prototype.get_callbacks;
        codecell.CodeCell.prototype.get_callbacks = function() {
            var that = this;
            var callbacks = previous_get_callbacks.apply(this, arguments);
            var prev_iopub_output_callback = callbacks.iopub.output;
            callbacks.iopub.output = function(msg) {
                prev_iopub_output_callback(msg);
                update_pin_button_status(that.output_area);
            }
            var prev_iopub_clear_output_callback = callbacks.iopub.clear_output;
            callbacks.iopub.clear_output = function(msg) {
                prev_iopub_clear_output_callback(msg);
                update_pin_button_status(that.output_area);
            }
            return callbacks;
        };
    }

    function patch_CodeCell_clear_output() {
        console.log('[multi_outputs] patching CodeCell.prototype.clear_output');
        var previous_clear_output = codecell.CodeCell.prototype.clear_output;
        codecell.CodeCell.prototype.clear_output = function(wait) {
            previous_clear_output.apply(this, arguments);
            update_pin_button_status(this.output_area);
        }
    }

    function patch_CodeCell_handle_execute_reply() {
        console.log('[multi_outputs] patching CodeCell.prototype._handle_execute_reply');
        var previous_handle_execute_reply = codecell.CodeCell.prototype._handle_execute_reply;
        codecell.CodeCell.prototype._handle_execute_reply = function (msg) {
            changeColor(false, this, msg);
            previous_handle_execute_reply.apply(this, arguments);
        };
    }

    var multi_outputs = function() {
        load_extension();
        patch_CodeCell_get_callbacks();
        patch_CodeCell_clear_output();
        patch_CodeCell_handle_execute_reply();

        var original_codecell_execute = codecell.CodeCell.prototype.execute;
        codecell.CodeCell.prototype.execute = function (stop_on_error) {
            // For Freeze extension
            if (!(this.metadata.run_through_control === undefined) && this.metadata.run_through_control.frozen) {
                console.log("Can't execute cell since cell is frozen.");
                return;
            }

            if (!this.kernel) {
                console.log("Can't execute cell since kernel is not set.");
                return;
            }

            if (stop_on_error === undefined) {
                stop_on_error = true;
            }

            this.clear_output(false, true);
            var old_msg_id = this.last_msg_id;
            if (old_msg_id) {
                this.kernel.clear_callbacks_for_msg(old_msg_id);
                delete codecell.CodeCell.msg_cells[old_msg_id];
                this.last_msg_id = null;
            }
            if (this.get_text().trim().length === 0) {
                // nothing to do
                this.set_input_prompt(null);
                return;
            }

            var output_json = this.output_area.outputs[this.output_area.outputs.length-1];
            this.set_input_prompt('*');
            this.element.addClass("running");

            changeColor(true, this);

            this.element.find('.multi-output-tabs li#tab-output-current a').click();

            var callbacks = this.get_callbacks();

            var options = {silent: false, store_history: true, stop_on_error : stop_on_error};
            var data = {
                "lc_cell_data" : {
                    "lc_cell_meme" : this.metadata.lc_cell_meme
                }
            };
            $.extend(true, options, data);

            this.last_msg_id = this.kernel.execute(this.get_text(), callbacks, options);
            codecell.CodeCell.msg_cells[this.last_msg_id] = this;
            this.render();
            this.events.trigger('execute.CodeCell', {cell: this});
        };

        /**
        * execute this extension on load
        */
        var on_notebook_loaded = function() {
            Jupyter.notebook.get_cells().forEach( function(cell, index, array) {
                if (cell instanceof codecell.CodeCell) {
                    extend_cell(cell);
                }
            });
            init_events();
        };

        Jupyter.notebook.config.loaded.then(function on_config_loaded () {
            $.extend(true, options, Jupyter.notebook.config.data[mod_name]);
        }, function on_config_load_error (reason) {
            console.warn(log_prefix, 'Using defaults after error loading config:', reason);
        }).then(function do_stuff_with_config () {
            events.on("notebook_loaded.Notebook", on_notebook_loaded);
            if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
                on_notebook_loaded();
            }
        }).catch(function on_error (reason) {
            console.error(log_prefix, 'Error:', reason);
        });
    };

    return {
        load_ipython_extension : multi_outputs,
        load_jupyter_extension : multi_outputs
    };
});
