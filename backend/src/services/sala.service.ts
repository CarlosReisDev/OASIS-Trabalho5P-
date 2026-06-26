import { consultar, emTransacao } from '../db.js';
import { AppError } from '../utils/AppError.js';

// PK composta (id_hospital, num_bloco, num_sala).

export async function listar() {
  return consultar(`SELECT * FROM Sala ORDER BY id_hospital, num_bloco, num_sala`);
}

export async function buscar(h: number, b: number, s: number) {
  const r = await consultar(
    `SELECT * FROM Sala WHERE id_hospital = :h AND num_bloco = :b AND num_sala = :s`,
    { h, b, s },
  );
  if (r.length === 0) throw new AppError(404, `Sala (${h}/${b}/${s}) nao encontrada.`);
  return r[0];
}

export async function criar(body: any) {
  await emTransacao((conn) =>
    conn.execute(
      `INSERT INTO Sala (id_hospital, num_bloco, num_sala, status)
       VALUES (:id_hospital, :num_bloco, :num_sala, :status)`,
      {
        id_hospital: body.id_hospital,
        num_bloco: body.num_bloco,
        num_sala: body.num_sala,
        status: body.status ?? 'Disponivel',
      },
    ),
  );
  return buscar(body.id_hospital, body.num_bloco, body.num_sala);
}

export async function atualizar(h: number, b: number, s: number, body: any) {
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(
      `UPDATE Sala SET status = :status
        WHERE id_hospital = :h AND num_bloco = :b AND num_sala = :s`,
      { status: body.status, h, b, s },
    );
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) throw new AppError(404, `Sala (${h}/${b}/${s}) nao encontrada.`);
  return buscar(h, b, s);
}

export async function remover(h: number, b: number, s: number) {
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(
      `DELETE FROM Sala WHERE id_hospital = :h AND num_bloco = :b AND num_sala = :s`,
      { h, b, s },
    );
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) throw new AppError(404, `Sala (${h}/${b}/${s}) nao encontrada.`);
}
