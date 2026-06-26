import { criarApp } from './app.js';
import { env } from './config/env.js';
import { fecharPool, iniciarPool } from './db.js';

async function main() {
  await iniciarPool();
  const app = criarApp();
  const server = app.listen(env.port, () => {
    console.log(`OASIS API rodando em http://localhost:${env.port}`);
  });

  const encerrar = async () => {
    console.log('\nEncerrando...');
    server.close();
    await fecharPool();
    process.exit(0);
  };
  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);
}

main().catch((e) => {
  console.error('Falha ao iniciar:', e);
  process.exit(1);
});
