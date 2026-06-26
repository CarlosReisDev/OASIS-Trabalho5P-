import { useEffect, useRef } from 'react'

/** Executa fn agora e a cada `intervalo` ms. Encapsula o polling (trocavel por WS). */
export function usePolling(fn: () => void, intervalo = 5000, ativo = true) {
  const ref = useRef(fn)
  ref.current = fn

  useEffect(() => {
    if (!ativo) return
    ref.current()
    const id = setInterval(() => ref.current(), intervalo)
    return () => clearInterval(id)
  }, [intervalo, ativo])
}
