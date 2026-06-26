import { criarCrud } from '../services/crudFactory.js';
import { criarRouter } from './routerFactory.js';

const svc = criarCrud({
  tabela: 'TipoCirurgia',
  pk: 'cod_cirurgia',
  colunas: ['nome', 'duracao_estimada_minutos'],
  gerarId: true,
});

export default criarRouter(svc, { pkNumerica: true });
