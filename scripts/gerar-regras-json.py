"""Gera, a partir de plugins/equipe, os arquivos que dependem dele.

Rode sempre que mudar regras.md ou um subagente em plugins/equipe/agents:

    python scripts/gerar-regras-json.py

O que ele gera:

1. plugins/equipe/regras.json - as regras para o plugin (computador).
   No Windows sem Git Bash, o Claude Code roda o hook de início de sessão
   no PowerShell, que estraga os acentos do texto. O regras.json leva as
   mesmas regras com os acentos escritos como códigos \\uXXXX (só ASCII),
   que passam intactos por qualquer shell.

2. CLAUDE.md e .claude/agents/ na raiz - a mesma equipe para o Claude Code
   na nuvem (claude.ai/code). A nuvem não instala plugins, mas lê o
   CLAUDE.md e os subagentes que estão dentro do repositório. Lá os
   subagentes não têm o prefixo "equipe:" e não existe PowerShell (é Linux).
"""

import json
import re
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
pasta = raiz / "plugins" / "equipe"
texto = (pasta / "regras.md").read_text(encoding="utf-8")

# 1. regras.json do plugin
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

# 2. Versão para a nuvem
AVISO = "<!-- Gerado por scripts/gerar-regras-json.py a partir de plugins/equipe. Não edite à mão. -->\n\n"

NUVEM = """
## Na nuvem (claude.ai/code)

- Este repositório é **público**. Planilhas, currículos e qualquer arquivo que eu mandar na conversa são meus e **nunca** podem ser adicionados ao Git, commitados ou enviados (push). Trabalhe com eles só na pasta `arquivos/`, que o `.gitignore` deixa fora do Git.
- Quando eu mandar um arquivo na conversa, copie para `arquivos/` antes de mexer. Salve o resultado também em `arquivos/` e me diga o nome do arquivo gerado.
- Não mude a configuração da equipe (regras, subagentes, plugins) a não ser que eu peça.
- Para eu acompanhar a equipe: antes de delegar, crie uma tarefa na lista de tarefas com o nome do subagente e o que ele vai fazer (ex.: "Explorador: listar arquivos"). Marque como em andamento ao delegar e como concluída quando ele entregar.
"""

claude_md = AVISO + texto.replace("`equipe:", "`").rstrip("\n") + "\n" + NUVEM
(raiz / "CLAUDE.md").write_text(claude_md, encoding="utf-8", newline="\n")
print("CLAUDE.md (nuvem) atualizado")

destino = raiz / ".claude" / "agents"
destino.mkdir(parents=True, exist_ok=True)
for antigo in destino.glob("*.md"):
    antigo.unlink()
for agente in sorted((pasta / "agents").glob("*.md")):
    conteudo = agente.read_text(encoding="utf-8")
    conteudo = conteudo.replace("`equipe:", "`")
    # Sem PowerShell no Linux da nuvem.
    conteudo = re.sub(r"^(tools:.*?), PowerShell", r"\1", conteudo, flags=re.M)
    (destino / agente.name).write_text(conteudo, encoding="utf-8", newline="\n")
    print(f".claude/agents/{agente.name} (nuvem) atualizado")
