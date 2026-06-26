import { consultar, emTransacao } from '../db.js';
import { validarTransicaoSolicitacao } from '../domain/status/transicoes.js';
import { AppError } from '../utils/AppError.js';
import { parseData } from '../utils/parse.js';

// situacao_agenda: 'Agendada' (tem agendamento ativo), 'Cancelada' (so tem
// agendamento cancelado -> nao pode reagendar) ou NULL (livre para agendar).
// O status no banco continua 'Processada'; isto e so para exibicao/regras de UI.
const SELECT_BASE = `
  SELECT s.id_solicitacao, s.id_medico_solicitante, s.id_paciente, s.id_tipo_cirurgia,
         s.data_solicitacao, s.hora_solicitacao, s.urgencia, s.status,
         (CASE
            WHEN EXISTS (SELECT 1 FROM Agendamento ag
                          WHERE ag.id_solicitacao = s.id_solicitacao AND ag.status != 'Cancelado')
              THEN 'Agendada'
            WHEN EXISTS (SELECT 1 FROM Agendamento ag
                          WHERE ag.id_solicitacao = s.id_solicitacao)
              THEN 'Cancelada'
            ELSE NULL
          END) AS situacao_agenda
    FROM Solicitacao s`;

export async function listar() {
  return consultar(`${SELECT_BASE} ORDER BY s.id_solicitacao`);
}

export async function buscar(id: number) {
  const r = await consultar(`${SELECT_BASE} WHERE s.id_solicitacao = :id`, { id });
  if (r.length === 0) throw new AppError(404, `Solicitacao ${id} nao encontrada.`);
  return r[0];
}

export async function criar(body: any) {
  const id = await emTransacao(async (conn) => {
    const r = await conn.execute<{ NOVO: number }>(
      `SELECT NVL(MAX(id_solicitacao), 0) + 1 AS novo FROM Solicitacao`,
    );
    const novoId = r.rows![0].NOVO;
    await conn.execute(
      `INSERT INTO Solicitacao
         (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia,
          data_solicitacao, hora_solicitacao, urgencia, status)
       VALUES
         (:id, :id_medico_solicitante, :id_paciente, :id_tipo_cirurgia,
          :data_solicitacao, :hora_solicitacao, :urgencia, :status)`,
      {
        id: novoId,
        id_medico_solicitante: body.id_medico_solicitante,
        id_paciente: body.id_paciente,
        id_tipo_cirurgia: body.id_tipo_cirurgia,
        data_solicitacao: parseData(body.data_solicitacao, 'data_solicitacao'),
        hora_solicitacao: body.hora_solicitacao,
        urgencia: body.urgencia ?? null,
        status: body.status ?? 'Pendente',
      },
    );
    return novoId;
  });
  return buscar(id);
}

/** Atualiza dados editaveis. Status NAO muda aqui (use alterarStatus). */
export async function atualizar(id: number, body: any) {
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(
      `UPDATE Solicitacao
          SET id_medico_solicitante = :id_medico_solicitante,
              id_paciente = :id_paciente,
              id_tipo_cirurgia = :id_tipo_cirurgia,
              data_solicitacao = :data_solicitacao,
              hora_solicitacao = :hora_solicitacao,
              urgencia = :urgencia
        WHERE id_solicitacao = :id`,
      {
        id,
        id_medico_solicitante: body.id_medico_solicitante,
        id_paciente: body.id_paciente,
        id_tipo_cirurgia: body.id_tipo_cirurgia,
        data_solicitacao: parseData(body.data_solicitacao, 'data_solicitacao'),
        hora_solicitacao: body.hora_solicitacao,
        urgencia: body.urgencia ?? null,
      },
    );
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) throw new AppError(404, `Solicitacao ${id} nao encontrada.`);
  return buscar(id);
}

/** STATE: valida a transicao antes do UPDATE; o trigger e a rede de seguranca. */
export async function alterarStatus(id: number, novoStatus: string) {
  await emTransacao(async (conn) => {
    const r = await conn.execute<{ STATUS: string }>(
      `SELECT status FROM Solicitacao WHERE id_solicitacao = :id`,
      { id },
    );
    const atual = r.rows?.[0]?.STATUS;
    if (!atual) throw new AppError(404, `Solicitacao ${id} nao encontrada.`);
    validarTransicaoSolicitacao(atual, novoStatus);
    await conn.execute(
      `UPDATE Solicitacao SET status = :s WHERE id_solicitacao = :id`,
      { s: novoStatus, id },
    );
  });
  return buscar(id);
}

export async function remover(id: number) {
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(`DELETE FROM Solicitacao WHERE id_solicitacao = :id`, { id });
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) throw new AppError(404, `Solicitacao ${id} nao encontrada.`);
}
