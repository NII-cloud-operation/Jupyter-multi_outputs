metadata の更新で notebook が dirty になるので明示的に dirty にする処理は廃止した。

背景用の要素がなくても色つけられるので extend_prompt は廃止した。

実行中は output ごと消えるので update_pin_button_status は廃止した。

旧版では get_output_text で `data['text/plain']` を拾ってたけど、lab では取れないので省略した。
