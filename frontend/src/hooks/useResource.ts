import { useCallback, useEffect, useState } from 'react'
import { listar } from '@/lib/api'

/** Busca uma lista de um recurso, com loading e funcao de recarga. */
export function useResource<T = any>(recurso: string | null) {
  const [dados, setDados] = useState<T[]>([])
  const [carregando, setCarregando] = useState(false)

  const recarregar = useCallback(async () => {
    if (!recurso) return
    setCarregando(true)
    try {
      setDados(await listar<T>(recurso))
    } catch {
      // toast ja exibido pelo interceptor
    } finally {
      setCarregando(false)
    }
  }, [recurso])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, carregando, recarregar }
}
