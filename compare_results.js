define([
    'base/js/namespace',
    'jquery',
    'require'
],   function(IPython, $, require) {
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
    };

    return { load_ipython_extension : compare_results };
});
