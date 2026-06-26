import { readFileSync } from 'node:fs'
import { iniciarPool, emTransacao, fecharPool } from './src/db.js'

// Divide um arquivo .sql em comandos executaveis.
// Regra: linhas contendo apenas "/" terminam blocos PL/SQL; o restante e
// separado por ";". Blocos com BEGIN ou CREATE TRIGGER vao inteiros.
function comandos(sql: string): string[] {
  const chunks = sql.split(/^\s*\/\s*$/m)
  const out: string[] = []
  for (const chunk of chunks) {
    const c = chunk.trim()
    if (!c) continue
    const ehPlsql = /\bBEGIN\b/i.test(c) || /CREATE\s+(OR\s+REPLACE\s+)?TRIGGER/i.test(c)
    if (ehPlsql) {
      out.push(c)
    } else {
      const semComentarios = c.replace(/--[^\n]*/g, '')
      for (const s of semComentarios.split(';')) {
        const t = s.trim()
        if (t) out.push(t)
      }
    }
  }
  return out
}

async function rodarArquivo(caminho: string) {
  const sql = readFileSync(caminho, 'utf8')
  const lista = comandos(sql)
  console.log(`\n=== ${caminho} (${lista.length} comandos) ===`)
  await emTransacao(async (conn) => {
    for (const cmd of lista) {
      const resumo = cmd.replace(/\s+/g, ' ').slice(0, 60)
      try {
        await conn.execute(cmd)
        console.log('  ok:', resumo)
      } catch (e: any) {
        console.error('  ERRO:', resumo, '->', e.message?.split('\n')[0])
        throw e
      }
    }
  })
}

async function main() {
  await iniciarPool()
  await rodarArquivo('../Banco.sql')
  await rodarArquivo('../Triggers.sql')
  await rodarArquivo('../Povoamento.sql')
  console.log('\nSetup concluido.')
  await fecharPool()
}

main().catch((e) => {
  console.error('FALHA NO SETUP:', e.message ?? e)
  process.exit(1)
})
