"""Custom build script for hatch backend"""
import os
from pathlib import Path
import sys
try:
    from urllib.request import urlopen
except ImportError:
    from urllib import urlopen

HERE = Path(__file__).parent.resolve()
LIB = os.path.join(HERE, 'lc_multi_outputs', 'nbextension', 'lib')
from hatchling.builders.hooks.plugin.interface import BuildHookInterface

def download_diff_match_patch():
    if not os.path.exists(LIB):
        os.mkdir(LIB)
    with open(os.path.join(LIB, 'diff_match_patch.js'), 'wb') as f:
        f.write(urlopen('https://github.com/google/diff-match-patch/raw/master/javascript/diff_match_patch.js').read())


class CustomHook(BuildHookInterface):
    """A custom build hook."""
    PLUGIN_NAME = "custom"

    def initialize(self, version, build_data):
        """Initialize the hook."""
        if self.target_name not in ["wheel", "sdist"]:
            return
        download_diff_match_patch()