import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { atualizar } from '@/lib/api'
import { MSG } from '@/lib/mensagens'
import { dataParaBR, minutosParaHHMM } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function FilaRequisicoes() {
  const { dados, recarregar } = useResource('/api/solicitacoes')
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('Todos')
  const [urgencia, setUrgencia] = useState('Todas')

  const filtradas = dados.filter((s) => {
    if (busca && !String(s.ID_PACIENTE).includes(busca)) return false
    if (status !== 'Todos' && s.STATUS !== status) return false
    if (urgencia !== 'Todas' && s.URGENCIA !== urgencia) return false
    return true
  })

  async function mudarStatus(s: any, novo: string, msg: string) {
    try {
      await atualizar(`/api/solicitacoes/${s.ID_SOLICITACAO}/status`, { status: novo })
      toast.success(msg)
      recarregar()
    } catch {
      /* toast no interceptor */
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Fila de Requisicoes</h1>
        <p className="text-sm text-muted-foreground">
          Processe ou rejeite solicitacoes pendentes; agende as processadas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por CPF do paciente"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['Todos', 'Pendente', 'Processada', 'Rejeitada'].map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={urgencia} onValueChange={setUrgencia}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['Todas', 'Eletiva', 'Urgencia', 'Emergencia'].map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Urgencia</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {MSG.MSG10}
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((s) => (
              <TableRow key={s.ID_SOLICITACAO}>
                <TableCell>{s.ID_SOLICITACAO}</TableCell>
                <TableCell>{s.ID_PACIENTE}</TableCell>
                <TableCell>{s.ID_TIPO_CIRURGIA}</TableCell>
                <TableCell>{dataParaBR(s.DATA_SOLICITACAO)}</TableCell>
                <TableCell>{minutosParaHHMM(s.HORA_SOLICITACAO)}</TableCell>
                <TableCell>{s.URGENCIA ?? '—'}</TableCell>
                <TableCell><StatusBadge status={s.STATUS} /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {s.STATUS === 'Pendente' && (
                      <>
                        <Button size="sm" onClick={() => mudarStatus(s, 'Processada', 'Solicitacao processada.')}>
                          Processar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => mudarStatus(s, 'Rejeitada', MSG.MSG05)}
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {s.STATUS === 'Processada' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/agendamento?solicitacao=${s.ID_SOLICITACAO}`)}
                      >
                        Agendar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
