import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { atualizar } from '@/lib/api'
import { usePerfil } from '@/context/PerfilContext'
import { MSG } from '@/lib/mensagens'
import { dataParaBR, dataParaInput, hhmmParaMinutos, minutosParaHHMM } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { StatusBadge } from '@/components/StatusBadge'
import { useConfirm } from '@/components/ConfirmProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Versao simples (formulario). Gancho: trocar por drag-and-drop num quadro de horarios.
export function Reagendar() {
  const confirmar = useConfirm()
  const { perfil, medico } = usePerfil()
  const { dados, recarregar } = useResource('/api/agendamentos')
  const participantes = useResource('/api/medicos-participantes')
  const [sel, setSel] = useState<any | null>(null)

  // Cirurgiao so enxerga/reagenda as cirurgias em que participa (as "dele").
  // Gestor enxerga todas.
  const soDoMedico = perfil === 'Cirurgiao'
  const agendamentos = useMemo(() => {
    if (!soDoMedico || !medico) return dados
    const meus = new Set(
      participantes.dados
        .filter((p) => p.ID_MEDICO === medico.crm)
        .map((p) => p.ID_AGENDAMENTO),
    )
    return dados.filter((a) => meus.has(a.ID_AGENDAMENTO))
  }, [dados, participantes.dados, soDoMedico, medico])
  const [sala, setSala] = useState('')
  const [bloco, setBloco] = useState('')
  const [hospital, setHospital] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [salvando, setSalvando] = useState(false)

  function selecionar(a: any) {
    setSel(a)
    setSala(String(a.NUM_SALA))
    setBloco(String(a.NUM_BLOCO))
    setHospital(String(a.ID_HOSPITAL))
    setData(dataParaInput(a.DATA_AGENDAMENTO))
    setHora(minutosParaHHMM(a.HORA_AGENDAMENTO))
  }

  // Pre-selecao via ?agendamento=ID (vindo do Painel de Ocupacao).
  const [params] = useSearchParams()
  const jaPreselecionou = useRef(false)
  useEffect(() => {
    if (jaPreselecionou.current) return
    const id = params.get('agendamento')
    if (!id || agendamentos.length === 0) return
    const a = agendamentos.find((x) => String(x.ID_AGENDAMENTO) === id)
    if (a) {
      selecionar(a)
      jaPreselecionou.current = true
    }
  }, [params, agendamentos])

  async function salvarReagendamento() {
    if (!sel || !sala || !bloco || !hospital || !data || !hora) {
      toast.error(MSG.MSG06)
      return
    }
    setSalvando(true)
    try {
      await atualizar(`/api/agendamentos/${sel.ID_AGENDAMENTO}`, {
        id_solicitacao: sel.ID_SOLICITACAO,
        num_sala: Number(sala),
        num_bloco: Number(bloco),
        id_hospital: Number(hospital),
        data_agendamento: data,
        hora_agendamento: hhmmParaMinutos(hora),
      })
      toast.success(MSG.MSG04)
      setSel(null)
      recarregar()
    } catch {
      /* toast no interceptor (MSG07 em conflito) */
    } finally {
      setSalvando(false)
    }
  }

  async function cancelar() {
    if (!sel) return
    const ok = await confirmar({
      mensagem: 'Confirmar cancelamento desta cirurgia?',
      confirmarTexto: 'Cancelar cirurgia',
      destrutivo: true,
    })
    if (!ok) return
    try {
      await atualizar(`/api/agendamentos/${sel.ID_AGENDAMENTO}/status`, { status: 'Cancelado' })
      toast.success(MSG.MSG03)
      setSel(null)
      recarregar()
    } catch {
      /* toast no interceptor */
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Reagendar / Cancelar</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma cirurgia, edite a alocacao ou cancele (cancelamento e logico e libera a sala).
          {soDoMedico && ' Voce so pode reagendar as cirurgias em que participa.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    {soDoMedico
                      ? 'Voce ainda nao participa de nenhuma cirurgia para reagendar.'
                      : 'Nenhuma cirurgia cadastrada.'}
                  </TableCell>
                </TableRow>
              )}
              {agendamentos.map((a) => (
                <TableRow key={a.ID_AGENDAMENTO}>
                  <TableCell>{a.ID_AGENDAMENTO}</TableCell>
                  <TableCell>H{a.ID_HOSPITAL}/B{a.NUM_BLOCO}/S{a.NUM_SALA}</TableCell>
                  <TableCell>{dataParaBR(a.DATA_AGENDAMENTO)}</TableCell>
                  <TableCell>{minutosParaHHMM(a.HORA_AGENDAMENTO)}</TableCell>
                  <TableCell><StatusBadge status={a.STATUS} /></TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={a.STATUS === 'Cancelado'}
                      onClick={() => selecionar(a)}
                    >
                      Selecionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova alocacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!sel ? (
              <p className="text-sm text-muted-foreground">Selecione uma cirurgia na tabela.</p>
            ) : (
              <>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <b>Atual:</b> #{sel.ID_AGENDAMENTO} — H{sel.ID_HOSPITAL}/B{sel.NUM_BLOCO}/S{sel.NUM_SALA}{' '}
                  — {dataParaBR(sel.DATA_AGENDAMENTO)} {minutosParaHHMM(sel.HORA_AGENDAMENTO)}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label>Hospital</Label>
                    <Input value={hospital} onChange={(e) => setHospital(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bloco</Label>
                    <Input value={bloco} onChange={(e) => setBloco(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sala</Label>
                    <Input value={sala} onChange={(e) => setSala(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora</Label>
                  <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={salvarReagendamento} disabled={salvando} className="flex-1">
                    {salvando ? 'Salvando...' : 'Reagendar'}
                  </Button>
                  <Button variant="destructive" onClick={cancelar}>
                    Cancelar cirurgia
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
