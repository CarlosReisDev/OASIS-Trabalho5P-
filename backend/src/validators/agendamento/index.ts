import { ConflitoHorarioHandler } from './ConflitoHorarioHandler.js';
import { ContextoAgendamento, Handler } from './Handler.js';
import { HoraValidaHandler } from './HoraValidaHandler.js';
import { SolicitacaoProcessadaHandler } from './SolicitacaoProcessadaHandler.js';

export type { ContextoAgendamento, DadosAgendamento } from './Handler.js';

/** Monta a cadeia de validacao do agendamento na ordem correta. */
export function montarCadeiaAgendamento(): Handler {
  const cabeca = new HoraValidaHandler();
  cabeca
    .encadear(new SolicitacaoProcessadaHandler())
    .encadear(new ConflitoHorarioHandler());
  return cabeca;
}

export async function validarAgendamento(ctx: ContextoAgendamento): Promise<void> {
  await montarCadeiaAgendamento().tratar(ctx);
}
