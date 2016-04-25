define([
    'base/js/namespace',
    'jquery',
    'require',
    'notebook/js/codecell'
],   function(IPython, $, require, codecell) {
    "use strict";

    var register_toolbar_menu = function() {
        var init_cell_ui_callback = IPython.CellToolbar.utils.checkbox_ui_generator(
            'Leave a history',
            // setter
            function(cell, value) {
                cell.metadata.leave_history = value;
                if (value == true) {
                    // ToDo Processing in the case where the check box on
                } else {
                    // ToDo Processing in the case where the check box off
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
    };

    return { load_ipython_extension : compare_results };
});
