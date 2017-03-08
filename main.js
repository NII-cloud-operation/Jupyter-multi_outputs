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
    'services/config',
    'base/js/utils',
    'notebook/js/codecell',
    'notebook/js/outputarea',
    'codemirror/lib/codemirror',
    'codemirror/addon/merge/merge',
], function(IPython, $, require, events, configmod, utils, codecell, outputarea, codemirror, merge) {
    "use strict";

    var original_outputarea_safe_append = outputarea.OutputArea.prototype._safe_append;

    outputarea.OutputArea.prototype.create_tab_area = function() {
        this.clear_output();

        var subarea = $('<div/>').addClass('output_subarea').append($('<ul/>').attr('class', 'nav nav-tabs'));
        var toinsert = this.create_output_area();
        toinsert.append(subarea);

        original_outputarea_safe_append.apply(this, toinsert);
    };

    var register_toolbar_menu = function() {
        var init_cell_ui_callback = IPython.CellToolbar.utils.checkbox_ui_generator(
            'multi outputs',
            // setter
            function(cell, value) {
                cell.metadata.multi_outputs = value;
                cell.output_area.multi_outputs = value;
                if (value == true) {
                    cell.output_area.create_tab_area.apply(cell.output_area);
                } else {
                    cell.output_area.clear_output();
                }
            },
            // getter
            function(cell) {
                // if init_cell is undefined, it'll be interpreted as false anyway
                return cell.metadata.multi_outputs;
            }
        );

        // Register a callback to create a UI element for a cell toolbar.
        IPython.CellToolbar.register_callback('multi_output.is_init_cell', init_cell_ui_callback, 'code');
        // Register a preset of UI elements forming a cell toolbar.
        IPython.CellToolbar.register_preset('Multi outputs', ['multi_output.is_init_cell']);
    };

    /* Load additional CSS */
    var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name, 'css');
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    var load_extension = function() {
        load_css('codemirror/addon/merge/merge.css');
        load_css('./custom-codemirror.css');
    };

    var multi_outputs = function() {
        register_toolbar_menu();
        load_extension();
        outputarea.OutputArea.prototype._safe_append = function(toinsert) {
            if (!this.multi_outputs) {
                original_outputarea_safe_append.apply(this, toinsert);
            } else {
                try {
                    var output_element = this.element;
                    var subarea = output_element.children('div.output_area').children('div.output_subarea');
                    subarea.append(toinsert.children('div.output_subarea'));
                } catch(err) {
                    console.log(err);
                    // Create an actual output_area and output_subarea, which creates
                    // the prompt area and the proper indentation.
                    var toinsert = this.create_output_area();
                    var subarea = $('<div/>').addClass('output_subarea');
                    toinsert.append(subarea);
                    this._append_javascript_error(err, subarea);
                    this.element.append(toinsert);
                }
            }
        }

        var original_codecell_execute = codecell.CodeCell.prototype.execute;
        codecell.CodeCell.prototype.execute = function (stop_on_error) {
            if (!this._metadata.multi_outputs) {
                original_codecell_execute.apply(this, stop_on_error);
                return;
            }

            if (!this.kernel) {
                console.log("Can't execute cell since kernel is not set.");
                return;
            }

            if (stop_on_error === undefined) {
                stop_on_error = true;
            }

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
            $('.tab-stream').hide();
            $('.output_stream').hide();

            var output_json = this.output_area.outputs[this.output_area.outputs.length-1];
            this.set_input_prompt('*');
            this.element.addClass("running");
            var callbacks = this.get_callbacks();

            this.last_msg_id = this.kernel.execute(this.get_text(), callbacks, {silent: false, store_history: true,
                stop_on_error : stop_on_error});
            codecell.CodeCell.msg_cells[this.last_msg_id] = this;
            this.render();
            this.events.trigger('execute.CodeCell', {cell: this});
        };

        var output_area_convert_tab = function(output_area, json) {
            var data_id = Date.now();
            var output_element = $(output_area.element);
            var subarea = output_element.children('div.output_area').children('div.output_subarea')
            var ul = subarea.children('ul');
            var tab_name;
            if (json.output_type) {
                tab_name = 'tab-' + json.output_type; //tab-stream, tab-text, ...
            }

            var that = output_area;
            ul.append(
                $('<li/>')
                    .attr({ 'id': 'li-' + data_id })
                    .attr({ 'class':tab_name})
                    .append($('<button/>')
                        .button({
                            icons: { primary: 'ui-icon-circle-close' },
                            text: null
                        })
                        .on('click', function() {
                            that.outputs.splice(that.outputs.indexOf(json), 1);
                            $('#li-' + data_id ).remove();
                            $('#div-' + data_id ).remove();
                            $(subarea).tabs('refresh');

                            refresh_selectbox($(output_element).parents('div.code_cell'));
                        })
                    ).append( $('<a/>').attr( { href: '#div-' + data_id }).text(json.output_type))
            );

            subarea.children('div.output_subarea').last().attr({"id": 'div-' + data_id});

            $('.tab-stream').show();
            $('.output_stream').show();

            $(subarea).tabs();
            $(subarea).tabs('refresh');

            var tab_length = ul.children('li').length;
            $(subarea).tabs('option', 'active', tab_length - 1);

            // Add diff-area if the tabs >= 2
            if(tab_length >= 2) {
                add_diff_content(output_element, subarea, ul, that);
            }
        };

        codecell.CodeCell.prototype._handle_execute_reply = function (msg) {
            if (this._metadata.multi_outputs) {
                var output_json = this.output_area.outputs[this.output_area.outputs.length-1];
                if (output_json.output_type == 'stream') {
                    output_json.name = output_json.name + '_' + Date.now();
                }

                output_area_convert_tab(this.output_area, output_json);
            }

            this.set_input_prompt(msg.content.execution_count);
            this.element.removeClass("running");
            this.events.trigger('set_dirty.Notebook', {value: true});
        };

        /**
        * execute this extension on load
        */
        (function() {
            IPython.notebook.get_cells().forEach( function(cell, index, array) {
                if (cell._metadata.multi_outputs) {
                    var outputs = cell.output_area.outputs;
                    cell.output_area.outputs = null;

                    cell.output_area.multi_outputs = cell._metadata.multi_outputs;

                    cell.output_area.create_tab_area.apply(cell.output_area);

                    outputs.forEach( function(json, index, array) {
                         cell.output_area.append_output(json);
                         output_area_convert_tab(cell.output_area, json);
                    });
                }
            });
        })();
    };
    
    var add_diff_content = function(output_element, subarea, ul) {
        var cell = $(output_element).parents('div.code_cell');
        if($(cell).children('.diff-area').length) {
            refresh_selectbox(cell);
            return;
        }
        // Add diff area
        var diff_area = $('<div></div>')
            .attr('class', 'diff-area')
            .insertAfter(
                $(cell.children('.input'))
            );
        // Add diff button
        $(diff_area)
            .append($('<button/>')
                .attr('class', 'btn btn-default diff-button')
                .text('Find diff')
                .on('click', function() {
                    output_diff_area(cell, subarea, ul, diff_area);
                })
            ).append($('<select/>')
                .attr('class', 'diff-selector form-control')
            ).append($('<select/>')
                .attr('class', 'diff-selector form-control')
            ).append($('<input/>')
                .attr('class', 'diff-exclude form-control')
                .attr('type', 'text')
                .attr('placeholder', 'Exclude')
            );

            IPython.notebook.keyboard_manager.register_events($('.diff-exclude'));
        refresh_selectbox(cell);
    }

    var refresh_selectbox = function(cell) {
        var diff_area = cell.children('.diff-area');
        // Add select-box option
        var $tabs = $(cell).find('li');
        // 
        if($(diff_area).children('.diff-selector')) {
            $(diff_area).children('.diff-selector').children().remove();
        }
        var options = $.map($($tabs), function (name, value) {
            var isSelected = false;
            var text = (value + 1) + 'th';
            var $option = $('<option>', { value: value+1, text: text, selected: isSelected });
            return $option;
        });
        $(diff_area).children('.diff-selector').append(options);
    }

    var output_diff_area = function(cell, subarea, ul, diff_area) {
        var data_id = Date.now();
        // Add diff-result area
        $('<div></div>')
            .attr('class', 'output_subarea')
            .text('hoge')
            .insertAfter(
                cell.find('div.output_subarea').last()
            );
        // tab
        ul.append(
            $('<li/>')
                .attr({ 'id': 'diff-li-' + data_id })
                .append($('<button/>')
                    .button({
                        icons: { primary: 'ui-icon-circle-close' },
                        text: null
                    })
                    .on('click', function() {
                        $('#diff-li-' + data_id ).remove();
                        $('#diff-div-' + data_id ).remove();
                        $(subarea).tabs('refresh');
                    })
                ).append( $('<a/>').attr( { href: '#diff-div-' + data_id }).text('diff'))
        );
        cell.find('div.output_subarea').last().attr({"id": 'diff-div-' + data_id});

        // Get select-box value
        value = cell.find('div.output_subarea').eq(diff_area.children('.diff-selector').eq(1).val()).text();
        orig = cell.find('div.output_subarea').eq(diff_area.children('.diff-selector').eq(0).val()).text();
        var ignore = cell.find('.diff-exclude').val();
        if(ignore !== '') {
            value = value.replace(eval(ignore), "");
            orig = orig.replace(eval(ignore), "");
        }
        // Display diff
        initUI(2, 'diff-div-' + data_id );

        $(subarea).tabs();
        $(subarea).tabs('refresh');

        var tab_length = ul.children('li').length;
        $(subarea).tabs('option', 'active', tab_length - 1);
    }

    // Display diff
    var value, orig, dv, hilight= true;
    function initUI(panes, target_id) {
        var target = document.getElementById(target_id);
        if (value == null) return;
        target.innerHTML = "";
        dv = codemirror.MergeView(target, {
            value: value,
            orig: orig,
            lineNumbers: true,
            mode: "text/html",
            highlightDifferences: hilight
        });
    }

    function toggleDifferences() {
        dv.setShowDifferences(hilight = !hilight);
    }

    return {
        load_ipython_extension : multi_outputs
    };

    $([IPython.events]).on('notebook_loaded.Notebook', load_extension);

});