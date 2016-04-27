define([
    'base/js/namespace',
    'jquery',
    'require',
    'notebook/js/codecell',
    'notebook/js/outputarea'
],   function(IPython, $, require, codecell, outputarea) {
    "use strict";

    var original_outputarea_safe_append = outputarea.OutputArea.prototype._safe_append;

    var register_toolbar_menu = function() {
        var init_cell_ui_callback = IPython.CellToolbar.utils.checkbox_ui_generator(
            'Leave a history',
            // setter
            function(cell, value) {
                cell.metadata.leave_history = value;
                cell.output_area.leave_history = value;
                if (value == true) {
                    cell.output_area.clear_output();

                    var subarea = $('<div/>').addClass('output_subarea').append($('<ul/>'));
                    var toinsert = cell.output_area.create_output_area();
                    toinsert.append(subarea);

                    original_outputarea_safe_append.apply(cell.output_area, toinsert);
                } else {
                    cell.output_area.clear_output();
                }
            },
            // getter
            function(cell) {
                // if init_cell is undefined, it'll be interpreted as false anyway
                return cell.metadata.leave_history;
            }
        );

        // Register a callback to create a UI element for a cell toolbar.
        IPython.CellToolbar.register_callback('init_cell.is_init_cell', init_cell_ui_callback, 'code');
        // Register a preset of UI elements forming a cell toolbar.
        IPython.CellToolbar.register_preset('Leave a history', ['init_cell.is_init_cell']);
    };

    var compare_results = function() {
        register_toolbar_menu()

        outputarea.OutputArea.prototype._safe_append = function(toinsert) {
            if (!this.leave_history) {
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
            if (!this._metadata.leave_history) {
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
            var callbacks = this.get_callbacks();

            this.last_msg_id = this.kernel.execute(this.get_text(), callbacks, {silent: false, store_history: true,
                stop_on_error : stop_on_error});
            codecell.CodeCell.msg_cells[this.last_msg_id] = this;
            this.render();
            this.events.trigger('execute.CodeCell', {cell: this});
        };

        codecell.CodeCell.prototype._handle_execute_reply = function (msg) {
            if (this._metadata.leave_history) {
                var now = Date.now();
                var last_outputs = this.output_area.outputs[this.output_area.outputs.length-1];
                if (last_outputs.output_type == 'stream') {
                    last_outputs.name = last_outputs.name + '_' + now;
                }

                var output_element = $(this.output_area.element);
                var subarea = output_element.children('div.output_area').children('div.output_subarea')

                var ul = subarea.children('ul');
                ul.append($('<li><a href="#' + now + '">' + now + '</a></li>'));

                var last_div = subarea.find('div.output_subarea').last();
                last_div.attr({"id": now});

                $(subarea).tabs();
                $(subarea).tabs('refresh');

                var tab_length = ul.children('li').length;
                $(subarea).tabs('option', 'active', tab_length - 1);
            }

            this.set_input_prompt(msg.content.execution_count);
            this.element.removeClass("running");
            this.events.trigger('set_dirty.Notebook', {value: true});
        };
    };

    return { load_ipython_extension : compare_results };
});
