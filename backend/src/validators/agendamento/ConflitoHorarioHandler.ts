import { AppError } from '../../utils/AppError.js';
import { ContextoAgendamento, Handler } from './Handler.js';

interface Linha {
  QTD: number;
}

// Detecta sobreposicao de horario na mesma sala. Como a cirurgia pode atravessar
// a meia-noite, os intervalos sao comparados em MINUTOS ABSOLUTOS (data + hora),
// calculados no proprio SQL para evitar divergencia de timezone com o JS.
// Sobreposicao: inicioNovo < fimExistente AND inicioExistente < fimNovo.
export class ConflitoHorarioHandler extends Handler {
  async tratar(ctx: ContextoAgendamento): Promise<void> {
    const { conn, dados, duracao = 0 } = ctx;

    const r = await conn.execute<Linha>(
      `SELECT COUNT(*) AS qtd
         FROM Agendamento a
         JOIN Solicitacao s   ON s.id_solicitacao = a.id_solicitacao
         JOIN TipoCirurgia t  ON t.cod_cirurgia   = s.id_tipo_cirurgia
        WHERE a.num_sala    = :num_sala
          AND a.num_bloco   = :num_bloco
          AND a.id_hospital = :id_hospital
          AND a.status     != 'Cancelado'
          AND (:id_ag IS NULL OR a.id_agendamento != :id_ag)
          AND ( (:data_nova - DATE '1970-01-01') * 1440 + :hora_nova )
              < ( (a.data_agendamento - DATE '1970-01-01') * 1440
                  + a.hora_agendamento + NVL(t.duracao_estimada_minutos, 0) )
          AND ( (a.data_agendamento - DATE '1970-01-01') * 1440 + a.hora_agendamento )
              < ( (:data_nova - DATE '1970-01-01') * 1440 + :hora_nova + :duracao_nova )`,
      {
        num_sala: dados.num_sala,
        num_bloco: dados.num_bloco,
        id_hospital: dados.id_hospital,
        id_ag: dados.id_agendamento ?? null,
        data_nova: dados.data_agendamento,
        hora_nova: dados.hora_agendamento,
        duracao_nova: duracao,
      },
    );

    if ((r.rows?.[0]?.QTD ?? 0) > 0) {
      throw new AppError(
        409,
        'Conflito de horario: a sala ja esta ocupada nesse intervalo.',
      );
    }
    await super.tratar(ctx);
  }
}
