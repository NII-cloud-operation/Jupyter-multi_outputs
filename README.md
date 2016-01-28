# This is ...

## インストールが必要なもの
`/home/vagrant/notebook/notebook/static`へdiff_match_patch.jsをインストール
curl -o http://cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js

## extensionの有効化

```
IPython.notebook.config.update({
  "load_extensions": {"compare_results":true}
})
```
