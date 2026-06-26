import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ItemCatalogo {
  nome: string
  descricao: string
  tipoSql: string
}

export function Relatorios() {
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([])
  const [ativo, setAtivo] = useState<string | null>(null)
  const [linhas, setLinhas] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    api.get<ItemCatalogo[]>('/api/relatorios').then((r) => setCatalogo(r.data)).catch(() => {})
  }, [])

  async function abrir(nome: string) {
    setAtivo(nome)
    setCarregando(true)
    try {
      const { data } = await api.get(`/api/relatorios/${nome}`)
      setLinhas(data.dados ?? [])
    } catch {
      setLinhas([])
    } finally {
      setCarregando(false)
    }
  }

  const colunas = linhas[0] ? Object.keys(linhas[0]) : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Relatorios</h1>
        <p className="text-sm text-muted-foreground">
          Consultas SQL exigidas: juncao interna, juncao externa, GROUP BY, HAVING e subconsulta.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {catalogo.map((c) => (
          <Card
            key={c.nome}
            className={ativo === c.nome ? 'ring-2 ring-primary cursor-pointer' : 'cursor-pointer'}
            onClick={() => abrir(c.nome)}
          >
            <CardHeader>
              <CardTitle className="text-sm">{c.descricao}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs rounded bg-secondary px-2 py-0.5">{c.tipoSql}</span>
              <Button size="sm" variant="outline">Ver</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {ativo && (
        <Card>
          <CardHeader><CardTitle>{ativo}</CardTitle></CardHeader>
          <CardContent>
            {carregando ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : linhas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {colunas.map((c) => <TableHead key={c}>{c}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((row, i) => (
                    <TableRow key={i}>
                      {colunas.map((c) => (
                        <TableCell key={c}>{row[c] ?? '—'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
