#!/usr/bin/env python

from setuptools import setup
import os
import sys

HERE = os.path.abspath(os.path.dirname(__file__))
VERSION_NS = {}
with open(os.path.join(HERE, 'lc_multi_outputs', '_version.py')) as f:
    exec(f.read(), {}, VERSION_NS)

setup_args = dict (name='lc-multi-outputs',
      version=VERSION_NS['__version__'],
      description='LC multi outputs extension for Jupyter Notebook',
      packages=['lc_multi_outputs'],
      include_package_data=True,
      platforms=['Jupyter Notebook 4.2.x', 'Jupyter Notebook 5.x'],
      zip_safe=False,
      install_requires=[
          'notebook>=4.2.0',
      ]
)

if __name__ == '__main__':
    setup(**setup_args)

