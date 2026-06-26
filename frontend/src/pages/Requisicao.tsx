import { useState } from 'react'
import { toast } from 'sonner'
import { criar } from '@/lib/api'
import { MSG } from '@/lib/mensagens'
import { dataParaBR, hhmmParaMinutos } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function Requisicao() {
  const pacientes = useResource('/api/pacientes')
  const medicos = useResource('/api/medicos')
  const tipos = useResource('/api/tipos-cirurgia')

  const [medico, setMedico] = useState('')
  const [paciente, setPaciente] = useState('')
  const [tipo, setTipo] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [urgencia, setUrgencia] = useState('Eletiva')
  const [lateralidade, setLateralidade] = useState('Nao se aplica')
  const [obs, setObs] = useState('')
  const [enviando, setEnviando] = useState(false)

  const pacienteSel = pacientes.dados.find((p) => p.CPF === paciente)

  async function enviar() {
    if (!medico || !paciente || !tipo || !data || !hora) {
      toast.error(MSG.MSG06)
      return
    }
    setEnviando(true)
    try {
      await criar('/api/solicitacoes', {
        id_medico_solicitante: medico,
        id_paciente: paciente,
        id_tipo_cirurgia: Number(tipo),
        data_solicitacao: data,
        hora_solicitacao: hhmmParaMinutos(hora),
        urgencia,
      })
      toast.success(MSG.MSG01)
      setPaciente(''); setTipo(''); setData(''); setHora(''); setObs('')
    } catch {
      /* toast no interceptor */
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Requisicao de Cirurgia</h1>
        <p className="text-sm text-muted-foreground">
          O clinico identifica a necessidade e encaminha ao cirurgiao, que confirma o agendamento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da requisicao</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Medico solicitante *</Label>
            <Select value={medico || undefined} onValueChange={setMedico}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o medico" />
              </SelectTrigger>
              <SelectContent>
                {medicos.dados.map((m) => (
                  <SelectItem key={m.CRM} value={m.CRM}>
                    {m.CRM} - {m.NOME}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* [PROF] picker com mais dados para distinguir homonimos */}
          <div className="space-y-1.5">
            <Label>Paciente *</Label>
            <Select value={paciente || undefined} onValueChange={setPaciente}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {pacientes.dados.map((p) => (
                  <SelectItem key={p.CPF} value={p.CPF}>
                    {p.NOME} — nasc. {dataParaBR(p.DATA_NASCIMENTO)} — CPF ***{String(p.CPF).slice(-4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* painel compacto do paciente selecionado (nao ocupa a lateral toda) */}
          {pacienteSel && (
            <div className="md:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">{pacienteSel.NOME}</span>
              {' · '}nasc. {dataParaBR(pacienteSel.DATA_NASCIMENTO)}
              {' · '}CPF {pacienteSel.CPF}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Tipo de cirurgia *</Label>
            <Select value={tipo || undefined} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipos.dados.map((t) => (
                  <SelectItem key={t.COD_CIRURGIA} value={String(t.COD_CIRURGIA)}>
                    {t.NOME} ({t.DURACAO_ESTIMADA_MINUTOS ?? '?'} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Urgencia</Label>
            <Select value={urgencia} onValueChange={setUrgencia}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Eletiva">Eletiva</SelectItem>
                <SelectItem value="Urgencia">Urgencia</SelectItem>
                <SelectItem value="Emergencia">Emergencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Data *</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Hora *</Label>
            <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>

          {/* [PROF] lateralidade explicada (campo ilustrativo, nao persistido) */}
          <div className="space-y-1.5">
            <Label>Lateralidade</Label>
            <Select value={lateralidade} onValueChange={setLateralidade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nao se aplica">Nao se aplica</SelectItem>
                <SelectItem value="Esquerdo">Esquerdo</SelectItem>
                <SelectItem value="Direito">Direito</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Lado do corpo a operar (ilustrativo).</p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Observacoes clinicas</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Materiais, observacoes... (ilustrativo)" />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={enviar} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar requisicao'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
