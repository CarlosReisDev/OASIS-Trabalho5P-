import { createContext, useContext, useState, type ReactNode } from 'react'

export type Perfil = 'Clinico' | 'Cirurgiao' | 'Gestor'

export const PERFIS: { valor: Perfil; rotulo: string }[] = [
  { valor: 'Clinico', rotulo: 'Medico Clinico' },
  { valor: 'Cirurgiao', rotulo: 'Medico Cirurgiao' },
  { valor: 'Gestor', rotulo: 'Gestor Hospitalar' },
]

interface PerfilCtx {
  perfil: Perfil | null
  entrar: (p: Perfil) => void
  sair: () => void
}

const Ctx = createContext<PerfilCtx | null>(null)

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(
    () => (localStorage.getItem('oasis_perfil') as Perfil | null) ?? null,
  )

  const entrar = (p: Perfil) => {
    localStorage.setItem('oasis_perfil', p)
    setPerfil(p)
  }
  const sair = () => {
    localStorage.removeItem('oasis_perfil')
    setPerfil(null)
  }

  return <Ctx.Provider value={{ perfil, entrar, sair }}>{children}</Ctx.Provider>
}

export function usePerfil() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePerfil deve ser usado dentro de PerfilProvider')
  return c
}
