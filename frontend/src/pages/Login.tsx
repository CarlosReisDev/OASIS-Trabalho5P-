import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import {
  PERFIS,
  PERFIS_MEDICOS,
  usePerfil,
  type Perfil,
} from '@/context/PerfilContext'
import { useResource } from '@/hooks/useResource'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function Login() {
  const { entrar } = usePerfil()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState<Perfil | ''>('')
  const [crm, setCrm] = useState('')
  const medicos = useResource('/api/medicos')

  const ehMedico = perfil !== '' && PERFIS_MEDICOS.includes(perfil)
  // Medico da lista deve ter o mesmo perfil escolhido (Clinico/Cirurgiao).
  const medicosDoPerfil = medicos.dados.filter((m) => m.PERFIL === perfil)

  function trocarPerfil(v: Perfil) {
    setPerfil(v)
    setCrm('') // limpa o medico ao trocar de perfil
  }

  function entrarNoSistema() {
    if (!perfil) return
    if (ehMedico) {
      const m = medicos.dados.find((x) => x.CRM === crm)
      if (!m) return
      entrar(perfil, { crm: m.CRM, nome: m.NOME })
    } else {
      entrar(perfil)
    }
    navigate(perfil === 'Gestor' ? '/fila' : '/meus')
  }

  const pronto = !!perfil && (!ehMedico || !!crm)

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-primary/10 to-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="flex items-center gap-2 text-primary text-2xl font-bold">
            <Stethoscope className="h-7 w-7" /> OASIS
          </div>
          <CardTitle className="font-normal text-sm text-muted-foreground">
            Agendamento cirurgico — Joao XXIII e Maria Amelia Lins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Perfil (demo)</Label>
            <Select value={perfil || undefined} onValueChange={(v) => trocarPerfil(v as Perfil)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {PERFIS.map((p) => (
                  <SelectItem key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ehMedico && (
            <div className="space-y-1.5">
              <Label>Medico</Label>
              <Select value={crm || undefined} onValueChange={setCrm}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o medico" />
                </SelectTrigger>
                <SelectContent>
                  {medicosDoPerfil.map((m) => (
                    <SelectItem key={m.CRM} value={m.CRM}>
                      {m.CRM} - {m.NOME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {medicosDoPerfil.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum medico com este perfil cadastrado.</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Senha</Label>
            <Input type="password" placeholder="(qualquer valor — demo)" />
          </div>
          <Button className="w-full" onClick={entrarNoSistema} disabled={!pronto}>
            Entrar
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Prototipo academico. Dados sinteticos — nao use informacoes reais de pacientes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
