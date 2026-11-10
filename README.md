# Minha equipe no Claude Code

Configuração que transforma o Claude Code num "gerente" que distribui tarefas para modelos mais baratos quando faz sentido.

## O que tem aqui

```
usuario/                     → é copiado para a pasta ~/.claude de cada computador
  CLAUDE.md                  regras de trabalho (o "manual" do gerente)
  settings.json              modelo padrão: Opus; subagentes sem modelo definido: Haiku
  agents/
    leitor-planilhas.md      Haiku  - lê e descreve planilhas grandes
    conferente-planilhas.md  Haiku  - confere totais e erros depois de alterar
    Explore.md               Haiku  - busca arquivos em projetos (substitui o Explore padrão)
    log-reader.md            Haiku  - lê logs de testes
    revisor-codigo.md        Sonnet - revisa mudanças antes do commit
pasta-planilhas/.claude/
  settings.json              faz o Claude Code usar Sonnet dentro da sua pasta de planilhas
```

## Quem faz o quê

| Situação | Modelo principal | Por quê |
|---|---|---|
| Planilhas do dia a dia (na pasta de planilhas) | **Sonnet 5.5** | Rápido, metade do preço do Opus, bom com planilhas e documentos |
| Modelo financeiro complexo, ou planilha montada de muitos arquivos | **Opus 5.5** (`/model opus`) | Precisa de mais raciocínio |
| Projetos do GitHub (qualquer outra pasta) | **Opus 5.5** | Padrão recomendado para código |
| Refatoração ou migração grande num projeto | **Fable 5.2** (`/model`) | O mais capaz; use só quando Opus em `high` não der conta |
| Ler, buscar, conferir, ler logs | **Haiku 5.5** (subagentes) | Erros fáceis de perceber; custa muito pouco |

## Como instalar (em cada computador: casa e trabalho)

1. Abra o Claude Code em qualquer pasta e cole:

   > Clone o repositório `https://github.com/cayorangel/claude-equipe` para a pasta `~/claude-equipe` (no Windows, `C:\Users\<eu>\claude-equipe`). Depois copie o conteúdo da pasta `usuario` para a minha pasta `~/.claude`. Se já existir um `CLAUDE.md` ou `settings.json` lá, me mostre a diferença e junte os dois em vez de sobrescrever. Por fim, copie `pasta-planilhas/.claude` para dentro da pasta onde guardo minhas planilhas: `<COLOQUE O CAMINHO AQUI>`.

2. Feche e abra o Claude Code de novo. Digite `/agents` para ver a equipe.

No computador de casa, se não tiver pasta de planilhas, pule a última parte.

Requisitos:
- Claude Code **v2.1.293 ou mais novo** (para o apelido `haiku` apontar para o Haiku 5.5). Veja com `claude --version`.
- Git instalado (o Claude Code oferece para instalar se faltar).
- Para mexer em `.xlsx`, o Claude Code usa Python. Se não tiver, ele vai pedir para instalar - pode aceitar.

## Como atualizar a equipe

Mudou algo (num computador ou direto no GitHub)? Nos outros computadores, cole no Claude Code:

> Atualize minha equipe: rode `git pull` em `~/claude-equipe` e copie de novo a pasta `usuario` para `~/.claude`, juntando com o que já existe.

Para mudar a equipe, edite os arquivos em `~/claude-equipe`, peça ao Claude Code para fazer commit e push, e depois rode a atualização acima.

## No dia a dia

- **Planilhas:** abra o Claude Code na pasta de planilhas e peça normalmente, ex.: *"junte as abas de jan a mar de vendas.xlsx, some por vendedor e crie um gráfico"*. Ele lê com o `leitor-planilhas`, faz o trabalho e confere com o `conferente-planilhas`. O original nunca é sobrescrito.
- **GitHub:** abra o Claude Code na pasta do projeto. Peça a mudança; antes do commit ele chama o `revisor-codigo`.
- **Resultado fraco?** Primeiro `/effort` um nível acima; depois `/model` para o próximo modelo.
- **Trocar de modelo no meio de um trabalho:** peça um resumo, rode `/compact` e então `/model`.
- **Quanto gastei?** `/usage`. Para comparar modelos, rode a mesma tarefa com dois modelos e compare.
