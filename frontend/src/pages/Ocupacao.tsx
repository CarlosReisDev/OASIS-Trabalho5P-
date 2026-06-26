import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '@/lib/api'
import { dataParaBR, minutosParaHHMM } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { usePolling } from '@/hooks/usePolling'
import { GradeHorarios } from '@/components/GradeHorarios'
import { StatusBadge } from '@/components/StatusBadge'
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

export function Ocupacao() {
  const hospitais = useResource('/api/hospitais')
  const salas = useResource('/api/salas')
  const agendamentos = useResource('/api/agendamentos')

  const [hospital, setHospital] = useState('1')
  const [data, setData] = useState(hoje)
  const [chart, setChart] = useState<any[]>([])
  const [detalhe, setDetalhe] = useState<any | null>(null)

  async function carregarChart() {
    try {
      const { data: r } = await api.get('/api/relatorios/cirurgias-por-hospital')
      setChart(r.dados ?? [])
    } catch {
      /* toast no interceptor */
    }
  }

  useEffect(() => {
    carregarChart()
  }, [])

  // Polling 5s: atualiza agendamentos e o grafico (encapsulado em usePolling).
  usePolling(() => {
    agendamentos.recarregar()
    carregarChart()
  }, 5000)

  const salasHospital = useMemo(
    () => salas.dados.filter((s) => String(s.ID_HOSPITAL) === hospital),
    [salas.dados, hospital],
  )
  const agsDoDia = useMemo(
    () =>
      agendamentos.dados.filter(
        (a) =>
          String(a.ID_HOSPITAL) === hospital &&
          String(a.DATA_AGENDAMENTO).slice(0, 10) === data &&
          a.STATUS !== 'Cancelado',
      ),
    [agendamentos.dados, hospital, data],
  )

  const reagendados = agsDoDia.filter((a) => a.STATUS === 'Reagendado').length
  const slotsPorSala = 12 // 07h–19h
  const ocupacaoPct =
    salasHospital.length > 0
      ? Math.round((agsDoDia.length / (salasHospital.length * slotsPorSala)) * 100)
      : 0

  const cards = [
    { rotulo: 'Salas na unidade', valor: salasHospital.length },
    { rotulo: 'Procedimentos no dia', valor: agsDoDia.length },
    { rotulo: 'Reagendados', valor: reagendados },
    { rotulo: 'Ocupacao', valor: `${ocupacaoPct}%` },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Painel de Ocupacao</h1>
        <p className="text-sm text-muted-foreground">Atualizacao automatica a cada 5s.</p>
      </div>

      <div className="flex flex-wrap gap-3">
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
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Grade sala × horario — {dataParaBR(data)}</CardTitle></CardHeader>
          <CardContent>
            <GradeHorarios
              salas={salasHospital}
              agendamentos={agsDoDia}
              aoClicarOcupado={(a) => setDetalhe(a)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cirurgias por hospital</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="HOSPITAL" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="TOTAL_CIRURGIAS" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendamento #{detalhe?.ID_AGENDAMENTO}</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-1 text-sm">
              <p><b>Solicitacao:</b> #{detalhe.ID_SOLICITACAO}</p>
              <p><b>Local:</b> H{detalhe.ID_HOSPITAL} / B{detalhe.NUM_BLOCO} / S{detalhe.NUM_SALA}</p>
              <p><b>Data:</b> {dataParaBR(detalhe.DATA_AGENDAMENTO)}</p>
              <p><b>Hora:</b> {minutosParaHHMM(detalhe.HORA_AGENDAMENTO)}</p>
              <p className="flex items-center gap-2"><b>Status:</b> <StatusBadge status={detalhe.STATUS} /></p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
