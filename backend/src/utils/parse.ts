import { AppError } from './AppError.js';

/** Converte "YYYY-MM-DD" em Date (meia-noite UTC). */
export function parseData(valor: unknown, campo = 'data'): Date {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new AppError(400, `Campo ${campo} deve estar no formato YYYY-MM-DD.`);
  }
  return new Date(`${valor}T00:00:00Z`);
}

export function parseInteiro(valor: unknown, campo: string): number {
  const n = Number(valor);
  if (!Number.isInteger(n)) {
    throw new AppError(400, `Campo ${campo} deve ser um numero inteiro.`);
  }
  return n;
}

export function exigir<T>(valor: T | undefined | null, campo: string): T {
  if (valor === undefined || valor === null || valor === '') {
    throw new AppError(400, `Campo obrigatorio ausente: ${campo}.`);
  }
  return valor;
}
