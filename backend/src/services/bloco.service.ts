import { consultar, emTransacao } from '../db.js';
import { AppError } from '../utils/AppError.js';

// PK composta (id_hospital, num_bloco). num_bloco e informado pelo cliente.

export async function listar() {
  return consultar(`SELECT * FROM Bloco ORDER BY id_hospital, num_bloco`);
}

export async function buscar(idHospital: number, numBloco: number) {
  const r = await consultar(
    `SELECT * FROM Bloco WHERE id_hospital = :h AND num_bloco = :b`,
    { h: idHospital, b: numBloco },
  );
  if (r.length === 0) throw new AppError(404, `Bloco (${idHospital}/${numBloco}) nao encontrado.`);
  return r[0];
}

export async function criar(body: any) {
  await emTransacao((conn) =>
    conn.execute(
      `INSERT INTO Bloco (id_hospital, num_bloco, descricao)
       VALUES (:id_hospital, :num_bloco, :descricao)`,
      {
        id_hospital: body.id_hospital,
        num_bloco: body.num_bloco,
        descricao: body.descricao ?? null,
      },
    ),
  );
  return buscar(body.id_hospital, body.num_bloco);
}

export async function atualizar(idHospital: number, numBloco: number, body: any) {
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(
      `UPDATE Bloco SET descricao = :descricao WHERE id_hospital = :h AND num_bloco = :b`,
      { descricao: body.descricao ?? null, h: idHospital, b: numBloco },
    );
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) throw new AppError(404, `Bloco (${idHospital}/${numBloco}) nao encontrado.`);
  return buscar(idHospital, numBloco);
}

export async function remover(idHospital: number, numBloco: number) {
  const afetadas = await emTransacao(async (conn) => {
    const r = await conn.execute(
      `DELETE FROM Bloco WHERE id_hospital = :h AND num_bloco = :b`,
      { h: idHospital, b: numBloco },
    );
    return r.rowsAffected ?? 0;
  });
  if (afetadas === 0) throw new AppError(404, `Bloco (${idHospital}/${numBloco}) nao encontrado.`);
}
