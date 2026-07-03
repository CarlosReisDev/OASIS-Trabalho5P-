import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { usePerfil } from '@/context/PerfilContext'
import { useResource } from '@/hooks/useResource'
import { usePolling } from '@/hooks/usePolling'
import { dataParaBR, minutosParaHHMM } from '@/lib/tempo'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Perfil do medico: acompanha o status das suas requisicoes (como solicitante)
// e das suas cirurgias (onde participa). Somente leitura, com polling.
export function MeusAtendimentos() {
  const { medico } = usePerfil()
  const solicitacoes = useResource('/api/solicitacoes')
  const pacientes = useResource('/api/pacientes')
  const tipos = useResource('/api/tipos-cirurgia')
  const participantes = useResource('/api/medicos-participantes')

  usePolling(() => {
    solicitacoes.recarregar()
    participantes.recarregar()
  }, 5000, !!medico)

  const crm = medico?.crm

  const minhasSolicitacoes = useMemo(
    () => solicitacoes.dados.filter((s) => s.ID_MEDICO_SOLICITANTE === crm),
    [solicitacoes.dados, crm],
  )
  const minhasCirurgias = useMemo(
    () => participantes.dados.filter((p) => p.ID_MEDICO === crm),
    [participantes.dados, crm],
  )

  if (!medico) return <Navigate to="/login" replace />

  const nomePaciente = (cpf: string) =>
    pacientes.dados.find((p) => p.CPF === cpf)?.NOME ?? cpf
  const nomeTipo = (cod: number) =>
    tipos.dados.find((t) => t.COD_CIRURGIA === cod)?.NOME ?? `#${cod}`

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Meus atendimentos e cirurgias</h1>
        <p className="text-sm text-muted-foreground">
          {medico.nome} (CRM {medico.crm}) — acompanhe o status. Atualiza sozinho a cada 5s.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas requisicoes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agenda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {minhasSolicitacoes.map((s) => (
                <TableRow key={s.ID_SOLICITACAO}>
                  <TableCell>{s.ID_SOLICITACAO}</TableCell>
                  <TableCell>{nomePaciente(s.ID_PACIENTE)}</TableCell>
                  <TableCell>{nomeTipo(s.ID_TIPO_CIRURGIA)}</TableCell>
                  <TableCell>{dataParaBR(s.DATA_SOLICITACAO)}</TableCell>
                  <TableCell>{minutosParaHHMM(s.HORA_SOLICITACAO)}</TableCell>
                  <TableCell><StatusBadge status={s.STATUS} /></TableCell>
                  <TableCell><StatusBadge status={s.SITUACAO_AGENDA} /></TableCell>
                </TableRow>
              ))}
              {minhasSolicitacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    Nenhuma requisicao sua ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minhas cirurgias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agend.</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {minhasCirurgias.map((c) => (
                <TableRow key={c.ID_AGENDAMENTO}>
                  <TableCell>#{c.ID_AGENDAMENTO}</TableCell>
                  <TableCell>{dataParaBR(c.DATA_AGENDAMENTO)}</TableCell>
                  <TableCell>{minutosParaHHMM(c.HORA_AGENDAMENTO)}</TableCell>
                  <TableCell>{c.NUM_SALA}</TableCell>
                  <TableCell><StatusBadge status={c.STATUS} /></TableCell>
                </TableRow>
              ))}
              {minhasCirurgias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">
                    Voce ainda nao participa de nenhuma cirurgia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
