import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Campo, Coluna, EntidadeConfig } from '@/cadastros/configs'
import { atualizar, criar, listar, remover } from '@/lib/api'
import { MSG } from '@/lib/mensagens'
import { dataParaBR, dataParaInput, minutosParaHHMM } from '@/lib/tempo'
import { useResource } from '@/hooks/useResource'
import { StatusBadge } from '@/components/StatusBadge'
import { UrgenciaBadge } from '@/components/UrgenciaBadge'
import { useConfirm } from '@/components/ConfirmProvider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

type Form = Record<string, string>

function CampoDinamico({
  campo,
  value,
  onChange,
  disabled,
}: {
  campo: Campo
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const { dados } = useResource(campo.origem ?? null)
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={`Selecione ${campo.rotulo.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {dados.map((r) => {
          const val = String(r[campo.origemValor as string])
          return (
            <SelectItem key={val} value={val}>
              {campo.origemRotulo ? campo.origemRotulo(r) : val}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

// Carrega recursos referenciados por colunas FK (para resolver id -> nome).
function useLookups(recursos: string[]) {
  const chave = recursos.join('|')
  const [mapa, setMapa] = useState<Record<string, any[]>>({})
  useEffect(() => {
    if (!chave) return
    let vivo = true
    Promise.all(
      chave.split('|').map((r) => listar(r).then((d) => [r, d] as const).catch(() => [r, []] as const)),
    ).then((pares) => {
      if (vivo) setMapa(Object.fromEntries(pares))
    })
    return () => {
      vivo = false
    }
  }, [chave])
  return mapa
}

export function CrudPage({ config }: { config: EntidadeConfig }) {
  const confirmar = useConfirm()
  const { dados, carregando, recarregar } = useResource(config.endpoint)
  const recursosRef = Array.from(new Set(config.colunas.filter((c) => c.ref).map((c) => c.ref!.recurso)))
  const lookups = useLookups(recursosRef)
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form, setForm] = useState<Form>({})
  const [salvando, setSalvando] = useState(false)

  function abrirNovo() {
    setEditando(null)
    setForm({})
    setAberto(true)
  }

  function abrirEdicao(row: any) {
    setEditando(row)
    const inicial: Form = {}
    for (const campo of config.campos) {
      const bruto = row[campo.nome.toUpperCase()]
      inicial[campo.nome] =
        campo.tipo === 'date' ? dataParaInput(bruto) : bruto === null || bruto === undefined ? '' : String(bruto)
    }
    setForm(inicial)
    setAberto(true)
  }

  async function salvar() {
    const corpo: Record<string, unknown> = {}
    for (const campo of config.campos) {
      const v = (form[campo.nome] ?? '').trim()
      if (!v) {
        if (campo.obrigatorio) {
          toast.error(MSG.MSG06)
          return
        }
        corpo[campo.nome] = null
        continue
      }
      corpo[campo.nome] = campo.numerico ? Number(v) : v
    }
    setSalvando(true)
    try {
      if (editando) {
        await atualizar(`${config.endpoint}/${config.caminhoId(editando)}`, corpo)
        toast.success('Registro atualizado.')
      } else {
        await criar(config.endpoint, corpo)
        toast.success('Registro criado.')
      }
      setAberto(false)
      recarregar()
    } catch {
      // toast ja exibido pelo interceptor
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(row: any) {
    const ok = await confirmar({
      mensagem: 'Confirmar exclusao deste registro?',
      confirmarTexto: 'Excluir',
      destrutivo: true,
    })
    if (!ok) return
    try {
      await remover(`${config.endpoint}/${config.caminhoId(row)}`)
      toast.success('Registro removido.')
      recarregar()
    } catch {
      // toast ja exibido
    }
  }

  function renderCelula(col: Coluna, valor: any, row: any) {
    if (col.ref) {
      const linha = (lookups[col.ref.recurso] ?? []).find(
        (r) => String(r[col.ref!.chave]) === String(valor),
      )
      return linha ? col.ref.rotulo(linha) : (valor ?? '—')
    }
    if (col.tipo === 'status') return <StatusBadge status={valor} />
    if (col.tipo === 'statusSolicitacao') {
      // Se ja virou (ou foi) agendamento, mostra a situacao real em vez do status cru.
      if (valor === 'Processada' && row?.SITUACAO_AGENDA) {
        return <StatusBadge status={row.SITUACAO_AGENDA} />
      }
      return <StatusBadge status={valor} />
    }
    if (col.tipo === 'urgencia') return <UrgenciaBadge urgencia={valor} />
    if (col.tipo === 'hora') return minutosParaHHMM(valor)
    if (col.tipo === 'data') return dataParaBR(valor)
    return valor ?? '—'
  }

  const temAcoes = !config.somenteLeitura

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{config.titulo}</h1>
          <p className="text-sm text-muted-foreground">{dados.length} registro(s)</p>
        </div>
        {!config.somenteLeitura && (
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {config.colunas.map((c) => (
                <TableHead key={c.chave}>{c.rotulo}</TableHead>
              ))}
              {temAcoes && <TableHead className="w-24 text-right">Acoes</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!carregando && dados.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={config.colunas.length + (temAcoes ? 1 : 0)}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum registro.
                </TableCell>
              </TableRow>
            )}
            {dados.map((row, i) => (
              <TableRow key={i}>
                {config.colunas.map((c) => (
                  <TableCell key={c.chave}>{renderCelula(c, row[c.chave], row)}</TableCell>
                ))}
                {temAcoes && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!config.semAtualizar && (
                        <Button variant="ghost" size="icon" onClick={() => abrirEdicao(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => excluir(row)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar' : 'Novo'} — {config.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {config.campos.map((campo) => {
              const travado = !!editando && !!campo.bloqueadoNaEdicao
              return (
              <div key={campo.nome} className="space-y-1.5">
                <Label htmlFor={campo.nome}>
                  {campo.rotulo}
                  {campo.obrigatorio && <span className="text-destructive"> *</span>}
                </Label>
                {campo.origem ? (
                  <CampoDinamico
                    campo={campo}
                    value={form[campo.nome] ?? ''}
                    onChange={(v) => setForm((f) => ({ ...f, [campo.nome]: v }))}
                    disabled={travado}
                  />
                ) : campo.tipo === 'select' ? (
                  <Select
                    value={form[campo.nome] || undefined}
                    onValueChange={(v) => setForm((f) => ({ ...f, [campo.nome]: v }))}
                    disabled={travado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecione ${campo.rotulo.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {campo.opcoes?.map((o) => (
                        <SelectItem key={o.valor} value={o.valor}>
                          {o.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={campo.nome}
                    type={campo.tipo === 'number' ? 'number' : campo.tipo === 'date' ? 'date' : 'text'}
                    value={form[campo.nome] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [campo.nome]: e.target.value }))}
                  />
                )}
                {campo.ajuda && <p className="text-xs text-muted-foreground">{campo.ajuda}</p>}
              </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
