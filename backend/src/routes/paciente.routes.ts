import { criarCrud } from '../services/crudFactory.js';
import { criarRouter } from './routerFactory.js';

const svc = criarCrud({
  tabela: 'Paciente',
  pk: 'cpf',
  colunas: ['cpf', 'nome', 'data_nascimento'],
  datas: ['data_nascimento'],
});

export default criarRouter(svc);
