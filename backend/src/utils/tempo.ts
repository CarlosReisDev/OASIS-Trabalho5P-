// Horas no banco sao MINUTOS desde a meia-noite (480 = 08:00).

export const MINUTOS_POR_DIA = 1440;

export function minutosParaHHMM(minutos: number): string {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function horaValida(minutos: number): boolean {
  return Number.isInteger(minutos) && minutos >= 0 && minutos < MINUTOS_POR_DIA;
}

/**
 * Minutos absolutos numa linha do tempo continua, combinando data e hora-do-dia.
 * Usado para detectar conflito quando a cirurgia atravessa a meia-noite.
 */
export function minutosAbsolutos(data: Date, horaDoDia: number): number {
  const diasEpoch = Math.floor(data.getTime() / 86_400_000);
  return diasEpoch * MINUTOS_POR_DIA + horaDoDia;
}
