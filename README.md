# Introduction

このJupyter notebook extensionは、コードセルのアウトプットをタブ化し、複数のアウトプットの保存を可能にします。

# Setup

## Instration

1. make the `nbextensions` folder to `~/.ipython/`
2. copy the `multi_outputs` folder to `~/.ipython/nbextensions/`

## Configuration

1. make (or edit) youre `~/.jupyter/nbconfig/notebook.json` file

    ```
    {
      "load_extensions": {
        "multi_outputs/main": true
      }
    }
    ```

1. Edit the .jupyter/jupyter_notebook.json to look like this

    ```
    {
      "Exporter": {
        "preprocessors": [
          "pre_codefolding.CodeFoldingPreprocessor",
          "pre_pymarkdown.PyMarkdownPreprocessor"
        ]
      },
      "NbConvertApp": {
        "postprocessor_class": "post_embedhtml.EmbedPostProcessor"
      },
      "NotebookApp": {
        "server_extensions": [
          "nbextensions"
        ]
      },
      "version": 1
    }
    ```

    Edit the .jupyter/jupyter_nbconvert.json to look like this:

    ```
      {
        "Exporter": {
          "preprocessors": [
            "pre_codefolding.CodeFoldingPreprocessor",
            "pre_pymarkdown.PyMarkdownPreprocessor"
          ]
        },
        "NbConvertApp": {
          "postprocessor_class": "post_embedhtml.EmbedPostProcessor"
        },
        "version": 1
      }
    ```

    This procedure referred to https://github.com/ipython-contrib/IPython-notebook-extensions

# Usage

1. メニューの[View] - [Cell Toolbar] - [Multi outputs]を選びます
1. セルのツールバーにmulti outputsチェックボックスが表示されるので、複数の出力を保持したいセルのチェックボックスをonにします
1. チェックボックスをonにしたセルを実行すると、実行結果をタブ形式で表示します。
  - タブを削除することも可能です。

# Restriction

1. タブの内容は、.ipynbファイルではこのようにセルのoutputs配列の要素として保存されます。
    - 配列の要素 = タブの内容になります。

    ```
    {
     "cells": [
      {
       "cell_type": "code",
       "execution_count": 2,
       "metadata": {
        "collapsed": false,
        "multi_outputs": true
       },
       "outputs": [
        {
         "data": {
          "text/plain": [
           "'2016/06/29 04:53:34'"
          ]
         },
         "execution_count": 1,
         "metadata": {},
         "output_type": "execute_result"
        },
        {
         "data": {
          "text/plain": [
           "'2016/06/29 04:53:36'"
          ]
         },
         "execution_count": 2,
         "metadata": {},
         "output_type": "execute_result"
        }
       ],
       "source": [
        "from datetime import datetime\n",
        "datetime.now().strftime('%Y/%m/%d %H:%M:%S')"
       ]
      }
     ],
     "metadata": {
    ~~~ After that it is omitted ~~~
    ```

1. コードセルの1回の実行結果として複数のdisplay_data, execute_result または error タイプのレスポンスが返される場合、この Extension では正しく表示・保存できません。
    - 単独のレスポンスとしてdisplay_data, execute_result または error タイプのレスポンスが返される場合は正しく表示・保存が可能です。
    - 複数のstreamタイプのレスポンスが返される場合は１つのoutputとしてマージされますが、これはJupyter Notebookのデフォルトと同じです。

# License

This project is licensed under the terms of the Modified BSD License (also known as New or Revised or 3-Clause BSD), see LICENSE.txt.
