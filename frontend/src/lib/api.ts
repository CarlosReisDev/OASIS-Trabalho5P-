import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { MSG } from './mensagens'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
})

/** Traduz o erro do backend para uma mensagem amigavel (MSG07/MSG08...). */
export function mensagemDeErro(err: unknown): string {
  const ax = err as AxiosError<{ erro?: string }>
  const back = ax.response?.data?.erro ?? ''
  const baixo = back.toLowerCase()
  if (baixo.includes('conflito de horario')) return MSG.MSG07
  if (baixo.includes('cirurgiao') || baixo.includes('alcada')) return MSG.MSG08
  if (baixo.includes('obrigatorio')) return MSG.MSG06
  return back || 'Erro inesperado. Tente novamente.'
}

// Toast automatico em qualquer erro de requisicao (pode ser sobreposto no caller).
api.interceptors.response.use(
  (r) => r,
  (err) => {
    toast.error(mensagemDeErro(err))
    return Promise.reject(err)
  },
)

export async function listar<T = any>(recurso: string): Promise<T[]> {
  const { data } = await api.get<T[]>(recurso)
  return data
}

export async function criar<T = any>(recurso: string, corpo: unknown): Promise<T> {
  const { data } = await api.post<T>(recurso, corpo)
  return data
}

export async function atualizar<T = any>(recurso: string, corpo: unknown): Promise<T> {
  const { data } = await api.put<T>(recurso, corpo)
  return data
}

export async function remover(recurso: string): Promise<void> {
  await api.delete(recurso)
}
