import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { api, atualizar, criar } from '@/lib/api'
import { MSG } from '@/lib/mensagens'
import { dataParaBR, minutosParaHHMM } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { usePolling } from '@/hooks/usePolling'
import { GradeHorarios } from '@/components/GradeHorarios'
import { useConfirm } from '@/components/ConfirmProvider'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const hoje = new Date().toISOString().slice(0, 10)

interface SlotSel {
  sala: any
  hora: number
  ocupado?: any
}

export function Ocupacao() {
  const confirmar = useConfirm()
  const hospitais = useResource('/api/hospitais')
  const salas = useResource('/api/salas')
  const agendamentos = useResource('/api/agendamentos')
  const solicitacoes = useResource('/api/solicitacoes')

  const [hospital, setHospital] = useState('1')
  const [data, setData] = useState(hoje)
  const [detalhes, setDetalhes] = useState<Record<number, any>>({})
  const [slot, setSlot] = useState<SlotSel | null>(null)

  // estados do diálogo / reagendamento
  const [solEscolhida, setSolEscolhida] = useState('')
  const [agendando, setAgendando] = useState(false)
  const [reagendando, setReagendando] = useState<any | null>(null) // agendamento sendo movido

  // Mapa ID_AGENDAMENTO -> dados completos (paciente, medico, tipo) para o detalhe.
  async function carregarDetalhes() {
    try {
      const { data: r } = await api.get('/api/relatorios/agendamentos-detalhados')
      const mapa: Record<number, any> = {}
      for (const linha of r.dados ?? []) mapa[linha.ID_AGENDAMENTO] = linha
      setDetalhes(mapa)
    } catch {
      /* toast no interceptor */
    }
  }

  useEffect(() => {
    carregarDetalhes()
  }, [])

  usePolling(() => {
    agendamentos.recarregar()
    carregarDetalhes()
  }, 5000)

  const salasHospital = useMemo(
    () => salas.dados.filter((s) => String(s.ID_HOSPITAL) === hospital),
    [salas.dados, hospital],
  )
  // Todos os agendamentos do hospital (qualquer dia) — a grade calcula o vira-dia.
  const agsHospital = useMemo(
    () => agendamentos.dados.filter((a) => String(a.ID_HOSPITAL) === hospital),
    [agendamentos.dados, hospital],
  )
  const agsDoDia = useMemo(
    () =>
      agsHospital.filter(
        (a) => String(a.DATA_AGENDAMENTO).slice(0, 10) === data && a.STATUS !== 'Cancelado',
      ),
    [agsHospital, data],
  )

  // Disponiveis para agendar: Processada e sem nenhum agendamento (nem cancelado,
  // pois o cancelado e terminal e bloqueia novo agendamento).
  const processadasDisponiveis = solicitacoes.dados.filter(
    (s) => s.STATUS === 'Processada' && !s.SITUACAO_AGENDA,
  )

  const reagendados = agsDoDia.filter((a) => a.STATUS === 'Reagendado').length
  const ocupacaoPct =
    salasHospital.length > 0
      ? Math.round((agsDoDia.length / (salasHospital.length * 24)) * 100)
      : 0
  const cards = [
    { rotulo: 'Salas na unidade', valor: salasHospital.length },
    { rotulo: 'Procedimentos no dia', valor: agsDoDia.length },
    { rotulo: 'Reagendados', valor: reagendados },
    { rotulo: 'Ocupacao', valor: `${ocupacaoPct}%` },
  ]

  function mudarDia(delta: number) {
    const d = new Date(`${data}T00:00:00`)
    d.setDate(d.getDate() + delta)
    setData(d.toISOString().slice(0, 10))
  }

  function fecharDialog() {
    setSlot(null)
    setSolEscolhida('')
  }

  async function agendarNoSlot() {
    if (!slot || !solEscolhida) {
      toast.error('Selecione uma solicitacao processada.')
      return
    }
    setAgendando(true)
    try {
      await criar('/api/agendamentos', {
        id_solicitacao: Number(solEscolhida),
        num_sala: slot.sala.NUM_SALA,
        num_bloco: slot.sala.NUM_BLOCO,
        id_hospital: slot.sala.ID_HOSPITAL,
        data_agendamento: data,
        hora_agendamento: slot.hora,
      })
      toast.success(MSG.MSG02)
      fecharDialog()
      agendamentos.recarregar()
      solicitacoes.recarregar()
    } catch {
      /* toast no interceptor (MSG07) */
    } finally {
      setAgendando(false)
    }
  }

  // Entra no modo "mover": fecha o dialog e deixa a grade clicavel para o destino.
  function iniciarReag() {
    setReagendando(slot!.ocupado)
    setSlot(null)
  }

  // Clique num horario livre da grade enquanto reagenda -> grava no novo slot.
  async function reagendarNoSlot(sala: any, hora: number) {
    const a = reagendando
    const ok = await confirmar({
      titulo: 'Reagendar cirurgia',
      mensagem: `Mover cirurgia #${a.ID_AGENDAMENTO} para Sala ${sala.NUM_SALA}/Bloco ${sala.NUM_BLOCO} as ${minutosParaHHMM(hora)} de ${dataParaBR(data)}?`,
      confirmarTexto: 'Mover',
    })
    if (!ok) return
    try {
      await atualizar(`/api/agendamentos/${a.ID_AGENDAMENTO}`, {
        id_solicitacao: a.ID_SOLICITACAO,
        num_sala: sala.NUM_SALA,
        num_bloco: sala.NUM_BLOCO,
        id_hospital: sala.ID_HOSPITAL,
        data_agendamento: data,
        hora_agendamento: hora,
      })
      toast.success(MSG.MSG04)
      setReagendando(null)
      agendamentos.recarregar()
    } catch {
      /* toast no interceptor (MSG07) */
    }
  }

  async function cancelarCirurgia() {
    const a = slot!.ocupado
    const ok = await confirmar({
      mensagem: 'Confirmar cancelamento desta cirurgia?',
      confirmarTexto: 'Cancelar cirurgia',
      destrutivo: true,
    })
    if (!ok) return
    try {
      await atualizar(`/api/agendamentos/${a.ID_AGENDAMENTO}/status`, { status: 'Cancelado' })
      toast.success(MSG.MSG03)
      fecharDialog()
      agendamentos.recarregar()
    } catch {
      /* toast no interceptor */
    }
  }

  const det = slot?.ocupado ? detalhes[slot.ocupado.ID_AGENDAMENTO] : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Painel de Ocupacao</h1>
        <p className="text-sm text-muted-foreground">
          Atualizacao automatica a cada 5s. Clique num horario para ver detalhes ou agendar.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Hospital</Label>
          <Select value={hospital} onValueChange={setHospital}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {hospitais.dados.map((h) => (
                <SelectItem key={h.ID_HOSPITAL} value={String(h.ID_HOSPITAL)}>
                  {h.NOME}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Data</Label>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => mudarDia(-1)} title="Dia anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-40" />
            <Button variant="outline" size="icon" onClick={() => mudarDia(1)} title="Proximo dia">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.rotulo}>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{c.rotulo}</p>
              <p className="text-2xl font-semibold">{c.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {reagendando && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm">
          <span>
            <b>Reagendando #{reagendando.ID_AGENDAMENTO}</b>
            {detalhes[reagendando.ID_AGENDAMENTO] ? ` — ${detalhes[reagendando.ID_AGENDAMENTO].PACIENTE}` : ''}
            : clique num horario livre na grade (troque de dia/hospital se precisar).
          </span>
          <Button variant="ghost" size="sm" onClick={() => setReagendando(null)}>Cancelar</Button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Grade sala × horario — {dataParaBR(data)}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">
            Verde = livre (clique para agendar), vermelho = ocupada (clique para ver/reagendar).
            Cirurgia que passa da meia-noite continua no dia seguinte.
          </p>
          <GradeHorarios
            salas={salasHospital}
            agendamentos={agsHospital}
            dataBase={data}
            aoClicarOcupado={(a) =>
              reagendando
                ? toast.error('Escolha um horario livre (verde) para mover.')
                : setSlot({ sala: a, hora: a.HORA_AGENDAMENTO, ocupado: a })
            }
            aoSelecionar={(sala, hora) =>
              reagendando ? reagendarNoSlot(sala, hora) : setSlot({ sala, hora })
            }
          />
        </CardContent>
      </Card>

      <Dialog open={!!slot} onOpenChange={(o) => !o && fecharDialog()}>
        <DialogContent>
          {slot?.ocupado ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Agendamento #{slot.ocupado.ID_AGENDAMENTO} — {minutosParaHHMM(slot.ocupado.HORA_AGENDAMENTO)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-1 text-sm">
                {det ? (
                  <>
                    <p><b>Paciente:</b> {det.PACIENTE}</p>
                    <p><b>Cirurgia:</b> {det.TIPO_CIRURGIA} ({det.DURACAO_ESTIMADA_MINUTOS} min)</p>
                    <p><b>Medico solicitante:</b> {det.MEDICO_SOLICITANTE}</p>
                  </>
                ) : (
                  <p><b>Solicitacao:</b> #{slot.ocupado.ID_SOLICITACAO}</p>
                )}
                <p><b>Local:</b> H{slot.ocupado.ID_HOSPITAL} / B{slot.ocupado.NUM_BLOCO} / S{slot.ocupado.NUM_SALA}</p>
                <p><b>Data:</b> {dataParaBR(slot.ocupado.DATA_AGENDAMENTO)}</p>
                <p className="flex items-center gap-2"><b>Status:</b> <StatusBadge status={slot.ocupado.STATUS} /></p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="destructive" onClick={cancelarCirurgia}>Cancelar cirurgia</Button>
                <Button onClick={iniciarReag}>Reagendar</Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  Agendar — Sala {slot?.sala.NUM_SALA} / Bloco {slot?.sala.NUM_BLOCO} as {minutosParaHHMM(slot?.hora ?? 0)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Solicitacao aguardando agendamento</Label>
                <Select value={solEscolhida || undefined} onValueChange={setSolEscolhida}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a solicitacao" />
                  </SelectTrigger>
                  <SelectContent>
                    {processadasDisponiveis.map((s) => (
                      <SelectItem key={s.ID_SOLICITACAO} value={String(s.ID_SOLICITACAO)}>
                        #{s.ID_SOLICITACAO} — paciente {s.ID_PACIENTE} — {dataParaBR(s.DATA_SOLICITACAO)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {processadasDisponiveis.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma solicitacao aguardando agendamento (sem agendamento). Processe uma na Fila.
                  </p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={agendarNoSlot} disabled={agendando || !solEscolhida}>
                  <CalendarPlus className="h-4 w-4" />
                  {agendando ? 'Agendando...' : 'Agendar aqui'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
