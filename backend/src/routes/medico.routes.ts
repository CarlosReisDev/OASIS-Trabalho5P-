import { criarCrud } from '../services/crudFactory.js';
import { criarRouter } from './routerFactory.js';

// PK = crm (texto, informado pelo cliente).
const svc = criarCrud({
  tabela: 'Medico',
  pk: 'crm',
  colunas: ['crm', 'nome', 'email', 'especialidade', 'perfil'],
});

export default criarRouter(svc);
