import oracledb from 'oracledb';
import { env } from './config/env.js';

// SINGLETON — uma unica pool de conexao para toda a aplicacao.
// oracledb mantem a pool internamente; este modulo garante criacao unica.

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false; // controlamos commit/rollback manualmente

let pool: oracledb.Pool | null = null;

export async function iniciarPool(): Promise<void> {
  if (pool) return;
  // Modo THICK (Instant Client): usa cwallet.sso (auto-login, sem senha do wallet),
  // como o SQL Developer. configDir aponta para o wallet (tnsnames.ora + sqlnet.ora).
  const thick = !!env.oracle.clientLibDir;
  if (thick) {
    // No Linux as libs do Instant Client sao localizadas via LD_LIBRARY_PATH
    // (definido no script npm). Aqui so apontamos o configDir (wallet).
    oracledb.initOracleClient({ configDir: env.oracle.walletDir });
  }

  const cfg: oracledb.PoolAttributes = {
    user: env.oracle.user,
    password: env.oracle.password,
    connectString: env.oracle.connectString,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  };

  // Modo THIN com wallet (mTLS): precisa do ewallet.pem + senha do wallet.
  if (!thick && env.oracle.walletDir) {
    cfg.configDir = env.oracle.walletDir;
    cfg.walletLocation = env.oracle.walletDir;
    if (env.oracle.walletPassword) cfg.walletPassword = env.oracle.walletPassword;
  }

  pool = await oracledb.createPool(cfg);
}

export async function fecharPool(): Promise<void> {
  if (pool) {
    await pool.close(10);
    pool = null;
  }
}

function getPool(): oracledb.Pool {
  if (!pool) throw new Error('Pool nao inicializada. Chame iniciarPool() no boot.');
  return pool;
}

/** Executa uma consulta de leitura (sem transacao explicita). */
export async function consultar<T = any>(
  sql: string,
  binds: oracledb.BindParameters = {},
): Promise<T[]> {
  const conn = await getPool().getConnection();
  try {
    const r = await conn.execute<T>(sql, binds);
    return r.rows ?? [];
  } finally {
    await conn.close();
  }
}

/**
 * Executa um bloco dentro de uma transacao: commit no sucesso, rollback no erro.
 * A mesma conexao e passada ao callback para encadear varios comandos.
 */
export async function emTransacao<T>(
  fn: (conn: oracledb.Connection) => Promise<T>,
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    await conn.close();
  }
}
