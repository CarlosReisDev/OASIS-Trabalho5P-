import { AppError } from '../../utils/AppError.js';
import { horaValida } from '../../utils/tempo.js';
import { ContextoAgendamento, Handler } from './Handler.js';

// Hora de inicio deve estar em 0..1439 (minutos do dia). O CHECK no banco
// tambem garante; validar aqui da erro amigavel antes de bater no Oracle.
export class HoraValidaHandler extends Handler {
  async tratar(ctx: ContextoAgendamento): Promise<void> {
    if (!horaValida(ctx.dados.hora_agendamento)) {
      throw new AppError(
        400,
        'Hora de agendamento invalida: use minutos do dia entre 0 e 1439.',
      );
    }
    await super.tratar(ctx);
  }
}
