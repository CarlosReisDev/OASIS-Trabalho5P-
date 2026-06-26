import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { api, atualizar, criar } from '@/lib/api'
import { MSG } from '@/lib/mensagens'
import { dataParaBR, dataParaInput, hhmmParaMinutos, minutosParaHHMM } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { usePolling } from '@/hooks/usePolling'
import { GradeHorarios } from '@/components/GradeHorarios'
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
  const hospitais = useResource('/api/hospitais')
  const salas = useResource('/api/salas')
  const agendamentos = useResource('/api/agendamentos')
  const solicitacoes = useResource('/api/solicitacoes')

  const [hospital, setHospital] = useState('1')
  const [data, setData] = useState(hoje)
  const [detalhes, setDetalhes] = useState<Record<number, any>>({})
  const [slot, setSlot] = useState<SlotSel | null>(null)

  // estados do diálogo
  const [solEscolhida, setSolEscolhida] = useState('')
  const [agendando, setAgendando] = useState(false)
  const [modoReag, setModoReag] = useState(false)
  const [reForm, setReForm] = useState({ hospital: '', bloco: '', sala: '', data: '', hora: '' })
  const [salvandoReag, setSalvandoReag] = useState(false)

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

  // Processadas que AINDA NAO têm agendamento ativo (as agendadas não aparecem).
  const agendadas = useMemo(() => {
    const set = new Set<number>()
    for (const a of agendamentos.dados) if (a.STATUS !== 'Cancelado') set.add(a.ID_SOLICITACAO)
    return set
  }, [agendamentos.dados])
  const processadasDisponiveis = solicitacoes.dados.filter(
    (s) => s.STATUS === 'Processada' && !agendadas.has(s.ID_SOLICITACAO),
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
    setModoReag(false)
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

  function iniciarReag() {
    const a = slot!.ocupado
    setReForm({
      hospital: String(a.ID_HOSPITAL),
      bloco: String(a.NUM_BLOCO),
      sala: String(a.NUM_SALA),
      data: dataParaInput(a.DATA_AGENDAMENTO),
      hora: minutosParaHHMM(a.HORA_AGENDAMENTO),
    })
    setModoReag(true)
  }

  async function salvarReag() {
    const a = slot!.ocupado
    if (!reForm.hospital || !reForm.bloco || !reForm.sala || !reForm.data || !reForm.hora) {
      toast.error(MSG.MSG06)
      return
    }
    setSalvandoReag(true)
    try {
      await atualizar(`/api/agendamentos/${a.ID_AGENDAMENTO}`, {
        id_solicitacao: a.ID_SOLICITACAO,
        num_sala: Number(reForm.sala),
        num_bloco: Number(reForm.bloco),
        id_hospital: Number(reForm.hospital),
        data_agendamento: reForm.data,
        hora_agendamento: hhmmParaMinutos(reForm.hora),
      })
      toast.success(MSG.MSG04)
      fecharDialog()
      agendamentos.recarregar()
    } catch {
      /* toast no interceptor (MSG07) */
    } finally {
      setSalvandoReag(false)
    }
  }

  async function cancelarCirurgia() {
    const a = slot!.ocupado
    if (!confirm('Confirmar cancelamento desta cirurgia?')) return
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
            aoClicarOcupado={(a) => { setSlot({ sala: a, hora: a.HORA_AGENDAMENTO, ocupado: a }); setModoReag(false) }}
            aoSelecionar={(sala, hora) => { setSlot({ sala, hora }); setModoReag(false) }}
          />
        </CardContent>
      </Card>

      <Dialog open={!!slot} onOpenChange={(o) => !o && fecharDialog()}>
        <DialogContent>
          {slot?.ocupado ? (
            modoReag ? (
              <>
                <DialogHeader>
                  <DialogTitle>Reagendar #{slot.ocupado.ID_AGENDAMENTO}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Hospital</Label>
                    <Select
                      value={reForm.hospital || undefined}
                      onValueChange={(v) => setReForm({ ...reForm, hospital: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o hospital" /></SelectTrigger>
                      <SelectContent>
                        {hospitais.dados.map((h) => (
                          <SelectItem key={h.ID_HOSPITAL} value={String(h.ID_HOSPITAL)}>
                            {h.NOME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Bloco</Label>
                      <Input value={reForm.bloco} onChange={(e) => setReForm({ ...reForm, bloco: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sala</Label>
                      <Input value={reForm.sala} onChange={(e) => setReForm({ ...reForm, sala: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={reForm.data} onChange={(e) => setReForm({ ...reForm, data: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hora</Label>
                    <Input type="time" value={reForm.hora} onChange={(e) => setReForm({ ...reForm, hora: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setModoReag(false)}>Voltar</Button>
                  <Button onClick={salvarReag} disabled={salvandoReag}>
                    {salvandoReag ? 'Salvando...' : 'Salvar reagendamento'}
                  </Button>
                </div>
              </>
            ) : (
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
            )
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
