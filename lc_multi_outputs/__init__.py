import json
from pathlib import Path

from ._version import __version__

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "lc_multi_outputs"
    }]


# nbextension
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="nbextension",
        dest="lc_multi_outputs",
        require="lc_multi_outputs/main")]
