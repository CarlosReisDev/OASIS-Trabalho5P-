import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { criar } from '@/lib/api'
import { MSG } from '@/lib/mensagens'
import { dataParaBR, minutosParaHHMM } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { GradeHorarios, type Selecao } from '@/components/GradeHorarios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export function AgendamentoDireto() {
  const [params] = useSearchParams()
  const solicitacoes = useResource('/api/solicitacoes')
  const hospitais = useResource('/api/hospitais')
  const salas = useResource('/api/salas')
  const agendamentos = useResource('/api/agendamentos')

  const [etapa, setEtapa] = useState(1)
  const [solicitacao, setSolicitacao] = useState(params.get('solicitacao') ?? '')
  const [hospital, setHospital] = useState('')
  const [data, setData] = useState('')
  const [selecao, setSelecao] = useState<Selecao | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const processadas = solicitacoes.dados.filter((s) => s.STATUS === 'Processada')
  const solSel = solicitacoes.dados.find((s) => String(s.ID_SOLICITACAO) === solicitacao)

  // Disponiveis: Processada e sem nenhum agendamento (nem cancelado -> terminal).
  const processadasDisponiveis = processadas.filter((s) => !s.SITUACAO_AGENDA)

  const salasHospital = useMemo(
    () => salas.dados.filter((s) => String(s.ID_HOSPITAL) === hospital),
    [salas.dados, hospital],
  )
  // Todos os agendamentos do hospital (qualquer dia) — a grade calcula o vira-dia.
  const agsHospital = useMemo(
    () => agendamentos.dados.filter((a) => String(a.ID_HOSPITAL) === hospital),
    [agendamentos.dados, hospital],
  )

  function continuar() {
    if (!solicitacao || !hospital || !data) {
      toast.error(MSG.MSG06)
      return
    }
    setEtapa(2)
  }

  async function confirmar() {
    if (!selecao) {
      toast.error('Selecione um horario disponivel na grade.')
      return
    }
    setConfirmando(true)
    try {
      await criar('/api/agendamentos', {
        id_solicitacao: Number(solicitacao),
        num_sala: selecao.sala.NUM_SALA,
        num_bloco: selecao.sala.NUM_BLOCO,
        id_hospital: selecao.sala.ID_HOSPITAL,
        data_agendamento: data,
        hora_agendamento: selecao.hora,
      })
      toast.success(MSG.MSG02)
      setEtapa(1)
      setSelecao(null)
      setSolicitacao('')
      agendamentos.recarregar()
      solicitacoes.recarregar()
    } catch {
      /* toast no interceptor (MSG07 em conflito) */
    } finally {
      setConfirmando(false)
    }
  }

  if (etapa === 1) {
    return (
      <div className="max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Agendamento Direto</h1>
          <p className="text-sm text-muted-foreground">
            Passo 1: selecione a solicitacao e a unidade. Em seguida escolha o horario na grade.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Selecao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Solicitacao (Aguardando Agendamento) *</Label>
              <Select value={solicitacao || undefined} onValueChange={setSolicitacao}>
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
                  Nenhuma solicitacao aguardando agendamento. Processe uma na Fila de Requisicoes.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Unidade (hospital) *</Label>
              <Select value={hospital || undefined} onValueChange={setHospital}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o hospital" />
                </SelectTrigger>
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
              <Label>Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={continuar}>Continuar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Etapa 2 — modo foco (sidebar oculta pela rota /agendamento)
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setEtapa(1)}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* cabecalho com os dados selecionados */}
      <Card>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-1 py-3 text-sm">
          <span><b>Solicitacao:</b> #{solSel?.ID_SOLICITACAO}</span>
          <span><b>Paciente:</b> {solSel?.ID_PACIENTE}</span>
          <span><b>Unidade:</b> {hospitais.dados.find((h) => String(h.ID_HOSPITAL) === hospital)?.NOME}</span>
          <span><b>Data:</b> {dataParaBR(data)}</span>
          {selecao && (
            <span className="text-primary font-medium">
              Selecionado: Sala {selecao.sala.NUM_SALA} / Bloco {selecao.sala.NUM_BLOCO} as {minutosParaHHMM(selecao.hora)}
            </span>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-2">Grade de disponibilidade</h2>
        <p className="text-xs text-muted-foreground mb-2">
          Verde = livre, vermelho = ocupada. Clique em um horario livre para selecionar.
        </p>
        <GradeHorarios
          salas={salasHospital}
          agendamentos={agsHospital}
          dataBase={data}
          selecao={selecao}
          aoSelecionar={(sala, hora) => setSelecao({ sala, hora })}
          aoClicarOcupado={() => toast.error(MSG.MSG07)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setSelecao(null)}>
          Limpar selecao
        </Button>
        <Button onClick={confirmar} disabled={confirmando || !selecao}>
          {confirmando ? 'Confirmando...' : 'Confirmar agendamento'}
        </Button>
      </div>
    </div>
  )
}
