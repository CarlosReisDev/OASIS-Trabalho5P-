// Horas no banco sao MINUTOS desde a meia-noite (480 = 08:00).
// Exibir em HH:MM, mas gravar/enviar como inteiro.

export function minutosParaHHMM(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined) return ''
  const h = Math.floor(minutos / 60) % 24
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Converte data ISO/"YYYY-MM-DD..." do backend para "DD/MM/YYYY" para exibir. */
export function dataParaBR(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = iso.slice(0, 10)
  const [a, m, dia] = d.split('-')
  return dia && m && a ? `${dia}/${m}/${a}` : d
}

/** Extrai "YYYY-MM-DD" (para inputs type=date) de uma data do backend. */
export function dataParaInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}
