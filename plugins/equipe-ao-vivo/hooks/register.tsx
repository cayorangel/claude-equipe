import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Agente, Estado, Gerente } from '../types'

const PAINEL = 'equipe-ao-vivo'
const TITULO = 'Equipe ao vivo'
const MAX_AGENTES = 40

// Mude a etiqueta "shape" quando os campos mudarem: assim o que uma versão
// anterior guardou é descartado em vez de quebrar o desenho.
const agentes = atom({ plugin: 'equipe-ao-vivo', key: 'agentes' } as const, [], {
  shape: 'agentes-1',
})
const gerente = atom(
  { plugin: 'equipe-ao-vivo', key: 'gerente' } as const,
  { trabalhando: false, acoes: 0, ultimaAcao: '' },
  { shape: 'gerente-1' },
)

const NOMES: Record<string, string> = {
  'equipe:leitor-planilhas': 'Leitor de planilhas',
  'equipe:conferente-planilhas': 'Conferente de planilhas',
  'equipe:explorador': 'Explorador',
  'equipe:log-reader': 'Leitor de logs',
  'equipe:revisor-codigo': 'Revisor de código',
  'general-purpose': 'Ajudante geral',
  Explore: 'Explorador (padrão)',
  Plan: 'Planejador',
  fork: 'Cópia do gerente',
}

function nomeDe(tipo: string): string {
  return NOMES[tipo] ?? tipo.replace(/^[^:]+:/, '')
}

function arquivo(caminho: unknown): string {
  if (typeof caminho !== 'string' || caminho === '') return 'arquivo'
  const partes = caminho.split(/[\\/]/)
  return partes[partes.length - 1] || caminho
}

function curto(texto: unknown, max = 60): string {
  const t = typeof texto === 'string' ? texto.replace(/\s+/g, ' ').trim() : ''
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function descrever(ferramenta: string, args: Record<string, unknown>): string {
  switch (ferramenta) {
    case 'Read':
      return `Lendo ${arquivo(args.file_path)}`
    case 'Write':
      return `Criando ${arquivo(args.file_path)}`
    case 'Edit':
    case 'MultiEdit':
      return `Editando ${arquivo(args.file_path)}`
    case 'NotebookEdit':
      return `Editando ${arquivo(args.notebook_path)}`
    case 'Bash':
    case 'PowerShell':
      return curto(args.description) || 'Rodando um comando'
    case 'Grep':
      return `Procurando "${curto(args.pattern, 30)}"`
    case 'Glob':
      return `Listando ${curto(args.pattern, 30)}`
    case 'Agent':
    case 'Task':
      return `Delegou: ${curto(args.description, 40)}`
    case 'WebFetch':
      return 'Lendo uma página da web'
    case 'WebSearch':
      return `Pesquisando "${curto(args.query, 30)}"`
    default:
      return ferramenta.startsWith('mcp__')
        ? `Usando ${ferramenta.split('__').slice(1).join(' › ')}`
        : `Usando ${ferramenta}`
  }
}

function duracao(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}min ${s % 60}s`
}

const ESTADOS: Record<Estado, { icone: string; texto: string; cor: string }> = {
  trabalhando: { icone: '●', texto: 'trabalhando', cor: 'warning' },
  concluido: { icone: '✓', texto: 'concluído', cor: 'success' },
  interrompido: { icone: '■', texto: 'interrompido', cor: 'subtle' },
  erro: { icone: '✗', texto: 'erro', cor: 'error' },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'equipe',
      description: 'Abre o painel que mostra o que cada agente da equipe está fazendo',
    })
    void $.ui.open({ id: PAINEL, title: TITULO })

    return next(e)
  })

  on('command.run', { command: 'equipe' }, async $ => {
    await $.ui.open({ id: PAINEL, title: TITULO })

    return { text: 'Painel "Equipe ao vivo" aberto.' }
  })

  // Um subagente foi chamado: registra quem é e qual tarefa recebeu.
  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    if (r.agentId === undefined) return r

    const id = r.agentId
    const inicio = await $.clock.now()
    await update($, agentes, lista => {
      const antigo = lista.find(a => a.id === id)
      const novo: Agente = {
        id,
        tipo: e.subagentType,
        tarefa: e.description || curto(e.prompt, 80),
        modelo: r.model,
        estado: 'trabalhando',
        acoes: antigo?.acoes ?? 0,
        ultimaAcao: antigo?.ultimaAcao ?? 'Começando…',
        inicio: antigo?.inicio ?? inicio,
      }
      const resto = lista.filter(a => a.id !== id)
      return [...resto, novo].slice(-MAX_AGENTES)
    })

    return r
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, gerente, () => ({ trabalhando: true, acoes: 0, ultimaAcao: 'Pensando…' }))
    } else {
      // Um subagente retomado conta o tempo desta rodada, não desde a primeira.
      const id = e.agentId
      const inicio = await $.clock.now()
      await update($, agentes, lista =>
        lista.map(a =>
          a.id === id ? { ...a, estado: 'trabalhando' as const, inicio, duracaoMs: undefined } : a,
        ),
      )
    }

    return next(e)
  })

  // Cada ação (ler arquivo, rodar comando...) de qualquer agente.
  on('tool.call', async ($, e, next) => {
    const acao = descrever(e.tool, e as unknown as Record<string, unknown>)

    if (e.agentId === undefined) {
      await update($, gerente, g => ({ ...g, acoes: g.acoes + 1, ultimaAcao: acao }))
    } else {
      const id = e.agentId
      await update($, agentes, lista =>
        lista.map(a => (a.id === id ? { ...a, acoes: a.acoes + 1, ultimaAcao: acao } : a)),
      )
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, gerente, g => ({ ...g, trabalhando: false }))
    } else {
      const id = e.agentId
      const estado: Estado =
        e.reason === 'answer' ? 'concluido' : e.reason === 'aborted' ? 'interrompido' : 'erro'
      const fim = await $.clock.now()
      await update($, agentes, lista =>
        lista.map(a => (a.id === id ? { ...a, estado, duracaoMs: fim - a.inicio } : a)),
      )
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const lista = await read($, agentes)
    const g: Gerente = await read($, gerente)

    const ativos = lista.filter(a => a.estado === 'trabalhando').length
    const feitos = lista.filter(a => a.estado === 'concluido').length
    const ordenados = [...lista].reverse()

    return (
      <Box flexDirection="column" gap={1}>
        <Text dimColor>
          {lista.length === 0
            ? 'Nenhum subagente chamado ainda nesta sessão.'
            : `${lista.length} subagente(s) · ${ativos} trabalhando · ${feitos} concluído(s)`}
        </Text>

        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={g.trabalhando ? 'claude' : 'subtle'}
          paddingX={1}
        >
          <Text weight="semibold">
            <Text color={g.trabalhando ? 'claude' : 'subtle'}>{g.trabalhando ? '●' : '○'}</Text>{' '}
            Gerente (principal)
          </Text>
          <Text dimColor>
            {g.trabalhando ? 'trabalhando' : 'aguardando você'}
            {g.acoes > 0 ? ` · ${g.acoes} ação(ões) neste pedido` : ''}
          </Text>
          {g.trabalhando && g.ultimaAcao !== '' && <Text wrap="truncate-end">{g.ultimaAcao}</Text>}
        </Box>

        {ordenados.map(a => {
          const est = ESTADOS[a.estado]
          const rodando = a.estado === 'trabalhando'
          return (
            <Box
              key={a.id}
              flexDirection="column"
              borderStyle="round"
              borderColor={rodando ? est.cor : 'subtle'}
              paddingX={1}
            >
              <Text weight="semibold">
                <Text color={est.cor}>{est.icone}</Text> {nomeDe(a.tipo)}
              </Text>
              <Text wrap="truncate-end">{a.tarefa}</Text>
              <Text dimColor>
                {est.texto} · {a.acoes} ação(ões)
                {a.duracaoMs !== undefined && !rodando ? ` · levou ${duracao(a.duracaoMs)}` : ''}
                {a.modelo ? ` · ${a.modelo.replace(/^claude-/, '')}` : ''}
              </Text>
              {rodando && <Text wrap="truncate-end">{a.ultimaAcao}</Text>}
            </Box>
          )
        })}

        {feitos > 0 && (
          <Button
            key="limpar"
            label="Limpar concluídos"
            onPress={() => update($, agentes, l => l.filter(a => a.estado !== 'concluido'))}
          />
        )}
      </Box>
    )
  })
}
