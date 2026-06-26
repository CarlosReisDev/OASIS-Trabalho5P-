import { useParams } from 'react-router-dom'
import { CADASTRO_POR_SLUG } from '@/cadastros/configs'
import { CrudPage } from '@/components/CrudPage'

export function Cadastro() {
  const { entidade } = useParams()
  const config = entidade ? CADASTRO_POR_SLUG.get(entidade) : undefined

  if (!config) {
    return <p className="text-muted-foreground">Cadastro nao encontrado.</p>
  }
  // key força remontagem ao trocar de entidade (reseta estado interno).
  return <CrudPage key={config.slug} config={config} />
}
