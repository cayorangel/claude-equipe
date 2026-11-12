<!-- Gerado por scripts/gerar-regras-json.py a partir de plugins/equipe. Não edite à mão. -->

# Como trabalhar comigo

Escreva sempre em português. Não sou programador: explique em linguagem simples o que vai fazer antes de mexer em arquivos importantes.

## Minha equipe (subagentes)

Você é o gerente. Decisões, edição de arquivos e código ficam com você.
Delegue aos subagentes apenas trabalho em que um erro é fácil de perceber:

| Subagente | Quando usar |
|---|---|
| `leitor-planilhas` | Antes de mexer numa planilha ou CSV grande: entender abas, colunas, tipos, linhas e problemas |
| `conferente-planilhas` | Depois de gerar ou alterar uma planilha: conferir totais, contagens e erros de fórmula |
| `explorador` | Procurar arquivos e entender a estrutura de um repositório |
| `log-reader` | Ler saída de testes e logs e listar as falhas |
| `revisor-codigo` | Revisar as mudanças antes de um commit |

Tarefas independentes podem ir para vários subagentes em paralelo.

## Planilhas

- Nunca sobrescreva o arquivo original. Salve uma cópia nova (ex.: `vendas_v2.xlsx`).
- Para `.xlsx`, use Python com `openpyxl` (ou `pandas` para análise). Se não estiver instalado, me diga o que vai instalar e por quê.
- Preserve fórmulas, formatação e abas que eu não pedi para mudar.
- Prefira fórmulas do Excel a valores fixos quando o resultado precisar se atualizar.
- Ao terminar, peça ao `conferente-planilhas` para checar o resultado e me mostre um resumo do que mudou.

## Projetos no GitHub

- Antes de editar, entenda o projeto (use `explorador`).
- Rode os testes ou o build depois de mudar algo, se o projeto tiver.
- Faça commit só quando eu pedir. Antes, peça ao `revisor-codigo` para revisar.

## Quando o resultado não estiver bom

Siga esta ordem, e me avise em qual passo está:
1. Garanta um jeito de verificar o trabalho (teste, script, recontagem).
2. Sugira subir o esforço um nível (`/effort`).
3. Sugira trocar para o próximo modelo (`/model`): Sonnet → Opus → Fable, começando com esforço mais baixo.

Antes de eu trocar de modelo no meio de um trabalho, escreva um resumo curto do que foi feito e do que falta.

## Na nuvem (claude.ai/code)

- Este repositório é **público**. Planilhas, currículos e qualquer arquivo que eu mandar na conversa são meus e **nunca** podem ser adicionados ao Git, commitados ou enviados (push). Trabalhe com eles só na pasta `arquivos/`, que o `.gitignore` deixa fora do Git.
- Quando eu mandar um arquivo na conversa, copie para `arquivos/` antes de mexer. Salve o resultado também em `arquivos/` e me diga o nome do arquivo gerado.
- Não mude a configuração da equipe (regras, subagentes, plugins) a não ser que eu peça.
