import oracledb from 'oracledb';
import { consultar, emTransacao } from '../db.js';
import { validarTransicaoAgendamento } from '../domain/status/transicoes.js';
import { AppError } from '../utils/AppError.js';
import { DadosAgendamento, validarAgendamento } from '../validators/agendamento/index.js';

// FACADE — orquestra validacao (Chain), regra de status (State) e SQL.
// Controllers nao conhecem detalhes de transacao nem das consultas.

// Inclui a duracao (via Solicitacao -> TipoCirurgia) para a grade pintar todos
// os slots que a cirurgia ocupa, nao so o de inicio.
const SELECT_BASE = `
  SELECT a.id_agendamento, a.id_solicitacao, a.num_sala, a.num_bloco, a.id_hospital,
         a.data_agendamento, a.hora_agendamento, a.status,
         t.duracao_estimada_minutos AS duracao
    FROM Agendamento a
    JOIN Solicitacao s  ON s.id_solicitacao = a.id_solicitacao
    JOIN TipoCirurgia t ON t.cod_cirurgia   = s.id_tipo_cirurgia`;

export async function listar() {
  return consultar(`${SELECT_BASE} ORDER BY a.id_agendamento`);
}

export async function buscar(id: number) {
  const r = await consultar(`${SELECT_BASE} WHERE a.id_agendamento = :id`, { id });
  if (r.length === 0) throw new AppError(404, `Agendamento ${id} nao encontrado.`);
  return r[0];
}

async function statusAtual(conn: oracledb.Connection, id: number): Promise<string> {
  const r = await conn.execute<{ STATUS: string }>(
    `SELECT status FROM Agendamento WHERE id_agendamento = :id`,
    { id },
  );
  const linha = r.rows?.[0];
  if (!linha) throw new AppError(404, `Agendamento ${id} nao encontrado.`);
  return linha.STATUS;
}

export async function criar(dados: DadosAgendamento) {
  const id = await emTransacao(async (conn) => {
    await validarAgendamento({ conn, dados });

    const r = await conn.execute<{ NOVO: number }>(
      `SELECT NVL(MAX(id_agendamento), 0) + 1 AS novo FROM Agendamento`,
    );
    const novoId = r.rows![0].NOVO;

    await conn.execute(
      `INSERT INTO Agendamento
         (id_agendamento, id_solicitacao, num_sala, num_bloco, id_hospital,
          data_agendamento, hora_agendamento, status)
       VALUES
         (:id, :id_solicitacao, :num_sala, :num_bloco, :id_hospital,
          :data_agendamento, :hora_agendamento, 'Agendado')`,
      {
        id: novoId,
        id_solicitacao: dados.id_solicitacao,
        num_sala: dados.num_sala,
        num_bloco: dados.num_bloco,
        id_hospital: dados.id_hospital,
        data_agendamento: dados.data_agendamento,
        hora_agendamento: dados.hora_agendamento,
      },
    );
    return novoId;
  });

  return buscar(id);
}

/** Reagenda (nova data/hora/sala). Revalida conflito ignorando o proprio registro. */
export async function reagendar(id: number, dados: Omit<DadosAgendamento, 'id_agendamento'>) {
  await emTransacao(async (conn) => {
    const atual = await statusAtual(conn, id);
    validarTransicaoAgendamento(atual, 'Reagendado');

    await validarAgendamento({ conn, dados: { ...dados, id_agendamento: id } });

    await conn.execute(
      `UPDATE Agendamento
          SET num_sala = :num_sala, num_bloco = :num_bloco, id_hospital = :id_hospital,
              data_agendamento = :data_agendamento, hora_agendamento = :hora_agendamento,
              status = 'Reagendado'
        WHERE id_agendamento = :id`,
      {
        id,
        num_sala: dados.num_sala,
        num_bloco: dados.num_bloco,
        id_hospital: dados.id_hospital,
        data_agendamento: dados.data_agendamento,
        hora_agendamento: dados.hora_agendamento,
      },
    );
  });
  return buscar(id);
}

/** Altera apenas o status (ex.: cancelar). State valida; trigger e a rede de seguranca. */
export async function alterarStatus(id: number, novoStatus: string) {
  await emTransacao(async (conn) => {
    const atual = await statusAtual(conn, id);
    validarTransicaoAgendamento(atual, novoStatus);
    await conn.execute(
      `UPDATE Agendamento SET status = :s WHERE id_agendamento = :id`,
      { s: novoStatus, id },
    );
  });
  return buscar(id);
}

export async function remover(id: number) {
  await emTransacao(async (conn) => {
    const r = await conn.execute(`DELETE FROM Agendamento WHERE id_agendamento = :id`, { id });
    if (r.rowsAffected === 0) throw new AppError(404, `Agendamento ${id} nao encontrado.`);
  });
}
