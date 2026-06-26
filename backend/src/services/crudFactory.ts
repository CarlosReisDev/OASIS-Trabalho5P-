import { consultar, emTransacao } from '../db.js';
import { AppError } from '../utils/AppError.js';
import { parseData } from '../utils/parse.js';

type ChavePk = string | number;

export interface CrudConfig {
  tabela: string;
  /** Coluna chave primaria (uso para tabelas de PK simples). */
  pk: string;
  /** Colunas que o cliente envia. Se gerarId=true, NAO inclua a pk. */
  colunas: string[];
  /** Se true, a pk e gerada por MAX+1. Caso contrario, vem do cliente. */
  gerarId?: boolean;
  /** Colunas do tipo DATE (recebem "YYYY-MM-DD" e viram Date). */
  datas?: string[];
}

function montarBinds(body: any, colunas: string[], datas: string[]): Record<string, any> {
  const binds: Record<string, any> = {};
  for (const c of colunas) {
    let v = body?.[c];
    if (v === undefined) v = null;
    if (datas.includes(c) && v !== null) v = parseData(v, c);
    binds[c] = v;
  }
  return binds;
}

/** FACADE generico de CRUD para tabelas de chave primaria simples. */
export function criarCrud(cfg: CrudConfig) {
  const { tabela, pk, colunas, gerarId = false, datas = [] } = cfg;
  const colsInsert = gerarId ? [pk, ...colunas] : colunas;
  const colsUpdate = colunas.filter((c) => c !== pk);

  async function buscar(id: ChavePk) {
    const r = await consultar(`SELECT * FROM ${tabela} WHERE ${pk} = :id`, { id });
    if (r.length === 0) throw new AppError(404, `${tabela} (${pk}=${id}) nao encontrado.`);
    return r[0];
  }

  async function listar() {
    return consultar(`SELECT * FROM ${tabela} ORDER BY ${pk}`);
  }

  async function criar(body: any) {
    const id = await emTransacao(async (conn) => {
      const binds = montarBinds(body, colunas, datas);
      let pkValor = body?.[pk];
      if (gerarId) {
        const r = await conn.execute<{ NOVO: number }>(
          `SELECT NVL(MAX(${pk}), 0) + 1 AS novo FROM ${tabela}`,
        );
        pkValor = r.rows![0].NOVO;
        binds[pk] = pkValor;
      }
      const placeholders = colsInsert.map((c) => `:${c}`).join(', ');
      await conn.execute(
        `INSERT INTO ${tabela} (${colsInsert.join(', ')}) VALUES (${placeholders})`,
        binds,
      );
      return pkValor;
    });
    return buscar(id);
  }

  async function atualizar(id: ChavePk, body: any) {
    const binds = montarBinds(body, colsUpdate, datas);
    binds.__id = id;
    const sets = colsUpdate.map((c) => `${c} = :${c}`).join(', ');
    const afetadas = await emTransacao(async (conn) => {
      const r = await conn.execute(`UPDATE ${tabela} SET ${sets} WHERE ${pk} = :__id`, binds);
      return r.rowsAffected ?? 0;
    });
    if (afetadas === 0) throw new AppError(404, `${tabela} (${pk}=${id}) nao encontrado.`);
    return buscar(id);
  }

  async function remover(id: ChavePk) {
    const afetadas = await emTransacao(async (conn) => {
      const r = await conn.execute(`DELETE FROM ${tabela} WHERE ${pk} = :id`, { id });
      return r.rowsAffected ?? 0;
    });
    if (afetadas === 0) throw new AppError(404, `${tabela} (${pk}=${id}) nao encontrado.`);
  }

  return { listar, buscar, criar, atualizar, remover };
}

export type CrudService = ReturnType<typeof criarCrud>;
