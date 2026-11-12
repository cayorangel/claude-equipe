import { expect, test } from 'claude-code/testing'

const PAINEL = {
  plugin: 'equipe-ao-vivo',
  component: 'Pane',
  requestId: 'equipe-ao-vivo',
  props: {
    title: 'Equipe ao vivo',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('painel vazio explica que ninguém foi chamado', async $ => {
  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(
    (await ui.find({ type: 'Text', text: /Nenhum subagente/ }))?.text,
  ).toBe('Nenhum subagente chamado ainda nesta sessão.')
  await ui.unmount()
})

test('um subagente chamado aparece com nome e tarefa', async ($, on) => {
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'a1' }))
  on('tool.call', () => ({ result: {} }))
  on('clock.now', () => ({ value: 1_000 }))

  await $.agent.spawn({
    prompt: 'Descreva a planilha vendas.xlsx',
    description: 'Ler vendas.xlsx',
    subagentType: 'equipe:leitor-planilhas',
  })
  await $.tool.call({ tool: 'Read', file_path: 'C:\\dados\\vendas.xlsx' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PAINEL, surface })
    expect(await ui.find({ type: 'Text', text: /Leitor de planilhas/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^Ler vendas/ }))?.text).toBe('Ler vendas.xlsx')
    expect(
      (await ui.find({ type: 'Text', text: /1 subagente/ }))?.text,
    ).toBe('1 subagente(s) · 1 trabalhando · 0 concluído(s)')
    await ui.unmount()
  }
})
