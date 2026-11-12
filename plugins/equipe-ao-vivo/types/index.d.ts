export type Estado = 'trabalhando' | 'concluido' | 'interrompido' | 'erro'

export type Agente = {
  id: string
  tipo: string
  tarefa: string
  modelo: string
  estado: Estado
  acoes: number
  ultimaAcao: string
  inicio: number
  duracaoMs?: number
}

export type Gerente = {
  trabalhando: boolean
  acoes: number
  ultimaAcao: string
}

declare module 'claude-code' {
  interface PluginState {
    'equipe-ao-vivo': {
      agentes: Shaped<Agente[]>
      gerente: Shaped<Gerente>
    }
  }
}
