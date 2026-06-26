import { AppError } from '../../utils/AppError.js';
import { ContextoAgendamento, Handler } from './Handler.js';

interface Linha {
  STATUS: string;
  DURACAO: number | null;
  JA_AGENDADA: number;
}

// A solicitacao precisa existir, estar 'Processada' e ainda nao ter agendamento.
// Tambem captura a duracao da cirurgia (via TipoCirurgia) para o proximo elo.
export class SolicitacaoProcessadaHandler extends Handler {
  async tratar(ctx: ContextoAgendamento): Promise<void> {
    const { conn, dados } = ctx;

    const r = await conn.execute<Linha>(
      `SELECT s.status AS status,
              t.duracao_estimada_minutos AS duracao,
              (SELECT COUNT(*) FROM Agendamento a
                WHERE a.id_solicitacao = s.id_solicitacao
                  AND (:id_ag IS NULL OR a.id_agendamento != :id_ag)) AS ja_agendada
         FROM Solicitacao s
         JOIN TipoCirurgia t ON t.cod_cirurgia = s.id_tipo_cirurgia
        WHERE s.id_solicitacao = :id_sol`,
      { id_sol: dados.id_solicitacao, id_ag: dados.id_agendamento ?? null },
    );

    const linha = r.rows?.[0];
    if (!linha) {
      throw new AppError(404, `Solicitacao ${dados.id_solicitacao} nao encontrada.`);
    }
    if (linha.STATUS !== 'Processada') {
      throw new AppError(
        409,
        `Solicitacao deve estar 'Processada' para ser agendada (atual: '${linha.STATUS}').`,
      );
    }
    if (linha.JA_AGENDADA > 0) {
      throw new AppError(409, 'Esta solicitacao ja possui um agendamento.');
    }

    ctx.duracao = linha.DURACAO ?? 0;
    await super.tratar(ctx);
  }
}
