# nbextension
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="nbextension",
        dest="multi_outputs",
        require="multi_outputs/main")]

