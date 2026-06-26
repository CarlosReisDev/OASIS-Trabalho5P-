import { criarCrud } from '../services/crudFactory.js';
import { criarRouter } from './routerFactory.js';

const svc = criarCrud({
  tabela: 'Hospital',
  pk: 'id_hospital',
  colunas: ['nome', 'endereco'],
  gerarId: true,
});

export default criarRouter(svc, { pkNumerica: true });
