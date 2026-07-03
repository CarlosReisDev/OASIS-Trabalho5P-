import { consultar, emTransacao } from '../db.js';
import { AppError } from '../utils/AppError.js';

// Tabela associativa N–N (id_agendamento, id_medico).
// INSERT/UPDATE disparam o trigger alcada_cirurgiao (so perfil 'Cirurgiao').

export async function listar() {
  return consultar(
    `SELECT mp.id_agendamento, mp.id_medico,
            a.data_agendamento, a.hora_agendamento, a.num_sala, a.status,
            m.nome AS medico_nome, m.especialidade
       FROM MedicosParticipantes mp
       JOIN Agendamento a ON a.id_agendamento = mp.id_agendamento
       JOIN Medico m      ON m.crm           = mp.id_medico
      ORDER BY mp.id_agendamento, m.nome`,
  );
}

export async function listarPorAgendamento(idAgendamento: number) {
  return consultar(
    `SELECT mp.id_medico, m.nome, m.especialidade
       FROM MedicosParticipantes mp
       JOIN Medico m ON m.crm = mp.id_medico
      WHERE mp.id_agendamento = :id
      ORDER BY m.nome`,
    { id: idAgendamento },
  );
}

export async function criar(body: any) {
  await emTransacao((conn) =>
    conn.execute(
      `INSERT INTO MedicosParticipantes (id_agendamento, id_medico)
       VALUES (:id_agendamento, :id_medico)`,
      { id_agendamento: body.id_agendamento, id_medico: body.id_medico },
    ),
  );
  return { id_agendamento: body.id_agendamento, id_medico: body.id_medico };
}

// Troca o cirurgiao de uma participacao. O trigger revalida o perfil do novo medico.
export async function atualizar(idAgendamento: number, idMedicoAtual: string, body: any) {
  const novoMedico = body.id_medico;
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(
      `UPDATE MedicosParticipantes
          SET id_medico = :novo
        WHERE id_agendamento = :a AND id_medico = :atual`,
      { novo: novoMedico, a: idAgendamento, atual: idMedicoAtual },
    );
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) {
    throw new AppError(404, `Participacao (${idAgendamento}/${idMedicoAtual}) nao encontrada.`);
  }
  return { id_agendamento: idAgendamento, id_medico: novoMedico };
}

export async function remover(idAgendamento: number, idMedico: string) {
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(
      `DELETE FROM MedicosParticipantes
        WHERE id_agendamento = :a AND id_medico = :m`,
      { a: idAgendamento, m: idMedico },
    );
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) {
    throw new AppError(404, `Participacao (${idAgendamento}/${idMedico}) nao encontrada.`);
  }
}
