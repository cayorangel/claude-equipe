"""Gera plugins/equipe/regras.json a partir de plugins/equipe/regras.md.

Rode sempre que mudar regras.md:

    python scripts/gerar-regras-json.py

Por que existe: no Windows sem Git Bash, o Claude Code roda o hook de
início de sessão no PowerShell, que estraga os acentos do texto. O
regras.json leva as mesmas regras com os acentos escritos como códigos
\\uXXXX (só caracteres ASCII), que passam intactos por qualquer shell.
O Claude Code lê o JSON e devolve os acentos ao texto.
"""

import json
from pathlib import Path

pasta = Path(__file__).resolve().parent.parent / "plugins" / "equipe"
texto = (pasta / "regras.md").read_text(encoding="utf-8")

saida = {
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": texto,
    }
}

(pasta / "regras.json").write_text(
    json.dumps(saida, ensure_ascii=True, indent=2) + "\n",
    encoding="ascii",
    newline="\n",
)
print("regras.json atualizado a partir de regras.md")
