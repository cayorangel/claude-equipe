# Minha equipe no Claude Code

Configuração que transforma o Claude Code num "gerente" que distribui tarefas para modelos mais baratos quando faz sentido.

A equipe é um **plugin do Claude Code**. Você instala uma vez em cada computador (casa e trabalho), e depois ela se atualiza sozinha a partir deste repositório.

## O que tem aqui

```
.claude-plugin/marketplace.json   "loja" com dois plugins: a equipe e o painel "Equipe ao vivo"
plugins/equipe-ao-vivo/
  .claude-plugin/plugin.json      nome e versão do painel
  hooks/hooks.json                diz ao Claude Code qual arquivo é o painel
  hooks/register.tsx              o painel ao lado do chat que mostra o que cada agente está fazendo
  types/index.d.ts                os dados que o painel guarda
  tests/painel.test.tsx           testes automáticos do painel (claude plugin test plugins/equipe-ao-vivo)
plugins/equipe/
  .claude-plugin/plugin.json      nome e versão do plugin
  regras.md                       regras de trabalho (o "manual" do gerente) - é este que se edita
  regras.json                     as mesmas regras em JSON, gerado a partir do regras.md (não edite à mão)
  hooks/hooks.json                entrega as regras ao Claude toda vez que uma sessão começa
  agents/
    leitor-planilhas.md           Haiku  - lê e descreve planilhas grandes
    conferente-planilhas.md       Sonnet - confere totais e erros depois de alterar
    explorador.md                 Haiku  - busca arquivos em projetos
    log-reader.md                 Haiku  - lê logs de testes
    revisor-codigo.md             Sonnet - revisa mudanças antes do commit
pasta-planilhas/.claude/
  settings.json                   modelo do arquivo que a instalação cria na sua pasta de planilhas (usa Sonnet lá)
scripts/gerar-regras-json.py      gera o regras.json a partir do regras.md
```

No Claude Code, os subagentes aparecem com o prefixo do plugin: `equipe:leitor-planilhas`, `equipe:explorador` etc.

## Quem faz o quê

| Situação | Modelo principal | Por quê |
|---|---|---|
| Planilhas do dia a dia (na pasta de planilhas) | **Sonnet 5.5** | Rápido, metade do preço do Opus, bom com planilhas e documentos |
| Modelo financeiro complexo, ou planilha montada de muitos arquivos | **Opus 5.5** (`/model opus`) | Precisa de mais raciocínio |
| Projetos do GitHub (qualquer outra pasta) | **Opus 5.5** | Padrão recomendado para código |
| Refatoração ou migração grande num projeto | **Fable 5.2** (`/model`) | O mais capaz; use só quando Opus em `high` não der conta |
| Ler, buscar, ler logs | **Haiku 5.5** (subagentes) | Erros fáceis de perceber; custa muito pouco |
| Conferir planilhas, revisar código | **Sonnet 5.5** (subagentes) | O trabalho é achar erros; um erro de quem confere passaria despercebido |

Cada subagente diz no próprio arquivo qual modelo usa (`model:`). Não defina `CLAUDE_CODE_SUBAGENT_MODEL`: essa configuração passaria por cima disso e o revisor e o conferente deixariam de usar Sonnet.

## Como instalar (uma vez em cada computador)

Abra o Claude Code **no próprio computador** (app desktop ou terminal, não a versão na nuvem), em qualquer pasta, e cole:

> Instale minha equipe do Claude Code:
> 1. Rode `claude plugin marketplace add cayorangel/claude-equipe`, depois `claude plugin install equipe@claude-equipe` e, por último, `claude plugin install equipe-ao-vivo@claude-equipe`.
> 2. No meu `~/.claude/settings.json`, juntando com o que já existe e sem apagar nada: na entrada `claude-equipe` de `extraKnownMarketplaces` (criada pelo passo 1), acrescente `"autoUpdate": true`; e coloque `"model": "opus"`. Me mostre a diferença antes de salvar.
> 3. Se existir um `~/.claude/CLAUDE.md` com as regras antigas desta equipe, ou uma pasta `~/.claude/agents` com os subagentes antigos (leitor-planilhas, conferente-planilhas, Explore, log-reader, revisor-codigo), me mostre e pergunte se posso apagar, porque agora eles vêm do plugin.
> 4. Me pergunte onde fica minha pasta de planilhas. Se eu tiver uma, crie nela o arquivo `.claude/settings.json` com `"model": "sonnet"` (igual a `pasta-planilhas/.claude/settings.json` deste repositório). Se já existir, junte sem apagar nada e me mostre a diferença antes de salvar. Se eu disser que não tenho, pule este passo.
> 5. No final, me diga o que foi feito e peça para eu fechar e abrir o Claude Code.

Depois de reabrir, pergunte "quais subagentes você tem?" para ver a equipe.

Requisitos:
- Claude Code **v2.1.293 ou mais novo** (para o apelido `haiku` apontar para o Haiku 5.5). Veja com `claude --version`.
- Git instalado (o Claude Code oferece para instalar se faltar). No Windows, se o instalador normal pedir administrador, o MinGit (versão portátil oficial) também serve; sem Git Bash, o Claude Code usa o PowerShell para entregar as regras, e os acentos chegam certos do mesmo jeito.
- Se este repositório for **privado**, o Git do computador precisa estar logado na sua conta do GitHub.
- Para mexer em `.xlsx`, o Claude Code usa Python. Se não tiver, ele vai pedir para instalar - pode aceitar.

Quem já tinha a equipe instalada só precisa rodar `claude plugin install equipe-ao-vivo@claude-equipe` e reabrir o Claude Code para ganhar o painel.

## Painel "Equipe ao vivo"

Um painel ao lado do chat (no app desktop e no terminal) que mostra, enquanto o trabalho acontece:

- o **Gerente**: se está trabalhando ou esperando você, e a ação do momento;
- **cada subagente chamado**: nome, tarefa recebida, estado (● trabalhando, ✓ concluído, ■ interrompido, ✗ erro), quantas ações fez, quanto tempo levou e qual modelo usou.

Ele abre sozinho em cada sessão; se fechar, digite `/equipe`. O botão **Limpar concluídos** tira da lista quem já terminou com sucesso. O painel só observa: não muda nem bloqueia nada do que os agentes fazem. Precisa de um Claude Code recente (testado na v2.1.321); em versões antigas ele simplesmente não aparece, e a equipe funciona normalmente.

## Como mudar a equipe

Em qualquer computador, peça ao Claude Code algo como:

> Na minha equipe (repositório `cayorangel/claude-equipe`), mude a regra X / crie um subagente para Y. Se mudar `plugins/equipe/regras.md`, rode `python scripts/gerar-regras-json.py` para atualizar o `regras.json`. Aumente a versão em `plugins/equipe/.claude-plugin/plugin.json`, faça commit e push.

**Importante:** aumentar a versão (ex.: `1.0.0` → `1.0.1`) é o que avisa os outros computadores que há novidade. Sem isso, eles não atualizam.

Os outros computadores pegam a versão nova sozinhos quando o Claude Code abrir. Para forçar na hora, digite `/plugin`, entre no marketplace `claude-equipe` e escolha atualizar, depois reinicie o Claude Code.

## No dia a dia

- **Planilhas:** abra o Claude Code na pasta de planilhas e peça normalmente, ex.: *"junte as abas de jan a mar de vendas.xlsx, some por vendedor e crie um gráfico"*. Ele lê com o `equipe:leitor-planilhas`, faz o trabalho e confere com o `equipe:conferente-planilhas`. O original nunca é sobrescrito.
- **GitHub:** abra o Claude Code na pasta do projeto. Peça a mudança; antes do commit ele chama o `equipe:revisor-codigo`.
- **Resultado fraco?** Primeiro `/effort` um nível acima; depois `/model` para o próximo modelo.
- **Trocar de modelo no meio de um trabalho:** peça um resumo, rode `/compact` e então `/model`.
- **Quanto gastei?** `/usage`. Para comparar modelos, rode a mesma tarefa com dois modelos e compare.

## Se o computador do trabalho bloquear plugins

Algumas empresas desligam plugins no Claude Code. Nesse caso, cole:

> Clone `https://github.com/cayorangel/claude-equipe` em `~/claude-equipe`. Copie `plugins/equipe/agents` para `~/.claude/agents` e junte o conteúdo de `plugins/equipe/regras.md` ao meu `~/.claude/CLAUDE.md`, me mostrando a diferença. Nas regras copiadas, tire o prefixo `equipe:` dos nomes dos subagentes.

Nesse modo não há atualização automática. Para atualizar, peça ao Claude Code para rodar `git pull` em `~/claude-equipe` e copiar de novo.
