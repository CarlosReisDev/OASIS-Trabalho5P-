import { createContext, useContext, useState, type ReactNode } from 'react'

export type Perfil = 'Clinico' | 'Cirurgiao' | 'Gestor'

export const PERFIS: { valor: Perfil; rotulo: string }[] = [
  { valor: 'Clinico', rotulo: 'Medico Clinico' },
  { valor: 'Cirurgiao', rotulo: 'Medico Cirurgiao' },
  { valor: 'Gestor', rotulo: 'Gestor Hospitalar' },
]

/** Perfis que representam um medico especifico (precisam de CRM no login). */
export const PERFIS_MEDICOS: Perfil[] = ['Clinico', 'Cirurgiao']

export interface MedicoLogado {
  crm: string
  nome: string
}

interface PerfilCtx {
  perfil: Perfil | null
  /** Medico logado (CRM/nome) quando o perfil e Clinico/Cirurgiao; null para Gestor. */
  medico: MedicoLogado | null
  entrar: (p: Perfil, medico?: MedicoLogado) => void
  sair: () => void
}

const Ctx = createContext<PerfilCtx | null>(null)

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(
    () => (localStorage.getItem('oasis_perfil') as Perfil | null) ?? null,
  )
  const [medico, setMedico] = useState<MedicoLogado | null>(() => {
    const bruto = localStorage.getItem('oasis_medico')
    return bruto ? (JSON.parse(bruto) as MedicoLogado) : null
  })

  const entrar = (p: Perfil, m?: MedicoLogado) => {
    localStorage.setItem('oasis_perfil', p)
    setPerfil(p)
    if (m) {
      localStorage.setItem('oasis_medico', JSON.stringify(m))
      setMedico(m)
    } else {
      localStorage.removeItem('oasis_medico')
      setMedico(null)
    }
  }
  const sair = () => {
    localStorage.removeItem('oasis_perfil')
    localStorage.removeItem('oasis_medico')
    setPerfil(null)
    setMedico(null)
  }

  return <Ctx.Provider value={{ perfil, medico, entrar, sair }}>{children}</Ctx.Provider>
}

export function usePerfil() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePerfil deve ser usado dentro de PerfilProvider')
  return c
}
