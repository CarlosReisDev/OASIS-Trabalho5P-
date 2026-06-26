import { minutosParaHHMM } from '@/lib/tempo'
import { cn } from '@/lib/utils'

export interface Selecao {
  sala: any
  hora: number
}

function idSala(s: any) {
  return `${s.ID_HOSPITAL}-${s.NUM_BLOCO}-${s.NUM_SALA}`
}

// Minutos de inicio relativos ao dia exibido (dataBase). Cirurgia do dia anterior
// que invade a madrugada fica com offset negativo; a que passa das 24h some no fim
// do dia e reaparece no dia seguinte. Sem dataBase, trata tudo como o mesmo dia.
function offsetInicio(ag: any, dataBase?: string): number {
  if (!dataBase) return ag.HORA_AGENDAMENTO
  const base = Date.parse(dataBase)
  const dia = Date.parse(String(ag.DATA_AGENDAMENTO).slice(0, 10))
  const diffDias = Math.round((base - dia) / 86_400_000)
  return ag.HORA_AGENDAMENTO - diffDias * 1440
}

// Cirurgia ocupa [inicio, inicio+duracao). Um slot fica ocupado se houver
// sobreposicao, pintando todos os quadrados que a cirurgia atravessa.
function agNoSlot(agendamentos: any[], sala: any, slot: number, passo: number, dataBase?: string) {
  return agendamentos.find((a) => {
    const dur = a.DURACAO ?? passo
    const ini = offsetInicio(a, dataBase)
    return (
      a.ID_HOSPITAL === sala.ID_HOSPITAL &&
      a.NUM_BLOCO === sala.NUM_BLOCO &&
      a.NUM_SALA === sala.NUM_SALA &&
      a.STATUS !== 'Cancelado' &&
      ini < slot + passo &&
      ini + dur > slot
    )
  })
}

export function GradeHorarios({
  salas,
  agendamentos,
  dataBase,
  inicio = 0,
  fim = 1440,
  passo = 60,
  selecao,
  aoSelecionar,
  aoClicarOcupado,
}: {
  salas: any[]
  agendamentos: any[]
  dataBase?: string
  inicio?: number
  fim?: number
  passo?: number
  selecao?: Selecao | null
  aoSelecionar?: (sala: any, hora: number) => void
  aoClicarOcupado?: (ag: any) => void
}) {
  const slots: number[] = []
  for (let m = inicio; m < fim; m += passo) slots.push(m)

  if (salas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma sala para os filtros atuais.</p>
  }

  // Rotulo compacto: so a hora cheia quando passo>=60 (cabe em coluna estreita).
  const rotuloSlot = (m: number) => (passo >= 60 ? String(Math.floor(m / 60)).padStart(2, '0') : minutosParaHHMM(m))

  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <table className="w-full table-fixed text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-muted z-10 px-2 py-2 text-left w-24">Sala</th>
            {slots.map((s) => (
              <th key={s} className="px-0 py-2 font-medium text-muted-foreground text-center" title={minutosParaHHMM(s)}>
                {rotuloSlot(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {salas.map((sala) => (
            <tr key={idSala(sala)} className="border-t">
              <td className="sticky left-0 bg-card z-10 px-2 py-2 whitespace-nowrap font-medium border-r text-[11px] w-24">
                H{sala.ID_HOSPITAL}/B{sala.NUM_BLOCO}/S{sala.NUM_SALA}
              </td>
              {slots.map((slot) => {
                const ocupado = agNoSlot(agendamentos, sala, slot, passo, dataBase)
                const selecionado =
                  selecao && idSala(selecao.sala) === idSala(sala) && selecao.hora === slot
                return (
                  <td key={slot} className="p-px">
                    <button
                      type="button"
                      onClick={() =>
                        ocupado
                          ? aoClicarOcupado?.(ocupado)
                          : aoSelecionar?.(sala, slot)
                      }
                      className={cn(
                        'h-7 w-full rounded-sm transition-colors',
                        ocupado
                          ? 'bg-status-ocupada/80 hover:bg-status-ocupada cursor-pointer'
                          : 'bg-status-disponivel/15 hover:bg-status-disponivel/30 cursor-pointer',
                        selecionado && 'ring-2 ring-primary bg-primary/30',
                      )}
                      title={ocupado ? `Ocupada #${ocupado.ID_AGENDAMENTO} (${minutosParaHHMM(ocupado.HORA_AGENDAMENTO)})` : `Livre ${minutosParaHHMM(slot)}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
