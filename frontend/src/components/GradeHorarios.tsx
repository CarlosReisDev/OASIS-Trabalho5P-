import { minutosParaHHMM } from '@/lib/tempo'
import { cn } from '@/lib/utils'

export interface Selecao {
  sala: any
  hora: number
}

function idSala(s: any) {
  return `${s.ID_HOSPITAL}-${s.NUM_BLOCO}-${s.NUM_SALA}`
}

function agNoSlot(agendamentos: any[], sala: any, slot: number, passo: number) {
  return agendamentos.find(
    (a) =>
      a.ID_HOSPITAL === sala.ID_HOSPITAL &&
      a.NUM_BLOCO === sala.NUM_BLOCO &&
      a.NUM_SALA === sala.NUM_SALA &&
      a.STATUS !== 'Cancelado' &&
      a.HORA_AGENDAMENTO >= slot &&
      a.HORA_AGENDAMENTO < slot + passo,
  )
}

export function GradeHorarios({
  salas,
  agendamentos,
  inicio = 420,
  fim = 1140,
  passo = 60,
  selecao,
  aoSelecionar,
  aoClicarOcupado,
}: {
  salas: any[]
  agendamentos: any[]
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

  return (
    <div className="overflow-auto border rounded-lg">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-muted z-10 px-3 py-2 text-left">Sala</th>
            {slots.map((s) => (
              <th key={s} className="px-2 py-2 font-medium text-muted-foreground min-w-[64px]">
                {minutosParaHHMM(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {salas.map((sala) => (
            <tr key={idSala(sala)} className="border-t">
              <td className="sticky left-0 bg-card z-10 px-3 py-2 whitespace-nowrap font-medium border-r">
                H{sala.ID_HOSPITAL} / B{sala.NUM_BLOCO} / S{sala.NUM_SALA}
              </td>
              {slots.map((slot) => {
                const ocupado = agNoSlot(agendamentos, sala, slot, passo)
                const selecionado =
                  selecao && idSala(selecao.sala) === idSala(sala) && selecao.hora === slot
                return (
                  <td key={slot} className="p-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        ocupado
                          ? aoClicarOcupado?.(ocupado)
                          : aoSelecionar?.(sala, slot)
                      }
                      className={cn(
                        'h-8 w-full rounded transition-colors',
                        ocupado
                          ? 'bg-status-ocupada/80 text-white cursor-pointer'
                          : 'bg-status-disponivel/15 hover:bg-status-disponivel/30 cursor-pointer',
                        selecionado && 'ring-2 ring-primary bg-primary/30',
                      )}
                      title={ocupado ? `Ocupada #${ocupado.ID_AGENDAMENTO}` : 'Disponivel'}
                    >
                      {ocupado ? '•' : ''}
                    </button>
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
