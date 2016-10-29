define([
    'base/js/namespace',
    'jquery',
    'require',
    'notebook/js/codecell',
    'notebook/js/outputarea'
],   function(IPython, $, require, codecell, outputarea) {
    "use strict";

    function changeColor(first, cell, msg){
        var outback = cell.output_area.prompt_overlay;
        var inback = cell.input[0].firstChild;

        if(first == true){
            $(outback).css({"background-color":"#e0ffff"});//現在のセルを予約色に変更
            $(inback).css({"background-color":"#e0ffff"});
        }
        else{
            if (msg.content.status != "ok" && msg.content.status != "aborted") {
                $(outback).css({"background-color": "#ffc0cb"}); //現在のセルを警告色に変更
                $(inback).css({"background-color": "#ffc0cb"});
            } else if (msg.content.status != "aborted") {
                $(outback).css({"background-color": "#faf0e6"}); //現在のセルを完了色に変更
                $(inback).css({"background-color": "#faf0e6"});
            }
        }
    }

    var original_outputarea_safe_append = outputarea.OutputArea.prototype._safe_append;

    outputarea.OutputArea.prototype.create_tab_area = function() {
        this.clear_output();

        var subarea = $('<div/>').addClass('output_subarea').append($('<ul/>'));
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
        IPython.CellToolbar.register_callback('init_cell.is_init_cell', init_cell_ui_callback, 'code');
        // Register a preset of UI elements forming a cell toolbar.
        IPython.CellToolbar.register_preset('Multi outputs', ['init_cell.is_init_cell']);
    };

    var multi_outputs = function() {
        register_toolbar_menu();

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
            this.set_input_prompt('*');
            this.element.addClass("running");

            changeColor(true, this);

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

            var that = output_area;
            ul.append(
                $('<li/>')
                    .attr({ 'id': 'li-' + data_id })
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
                        })
                    ).append( $('<a/>').attr( { href: '#div-' + data_id }).text(json.output_type))
            );

            subarea.children('div.output_subarea').last().attr({"id": 'div-' + data_id});

            $(subarea).tabs();
            $(subarea).tabs('refresh');

            var tab_length = ul.children('li').length;
            $(subarea).tabs('option', 'active', tab_length - 1);
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

            changeColor(false, this, msg);

            this.element.removeClass("running");
            this.events.trigger('set_dirty.Notebook', {value: true});
        };

        /**
        * execute this extension on load
        */
        var on_notebook_loaded = function() {
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
        };
        (function() {
            if(IPython.notebook.get_cells().length == 0) {
                $([IPython.events]).on("notebook_loaded.Notebook", on_notebook_loaded);
            }else{
                on_notebook_loaded();
            }
        })();
    };

    return { load_ipython_extension : multi_outputs };
});
