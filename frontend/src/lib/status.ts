// Rotulo de exibicao dos status. O VALOR no banco continua o mesmo
// (ex.: 'Processada'); aqui so traduzimos o que o usuario ve.
const ROTULOS: Record<string, string> = {
  Processada: 'Aguardando Agendamento',
}

export function rotuloStatus(status: string): string {
  return ROTULOS[status] ?? status
}
