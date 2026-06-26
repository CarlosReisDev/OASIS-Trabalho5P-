// Configuracao declarativa dos cadastros (espelha o crudFactory do backend).
// LEITURA: o Oracle devolve colunas em MAIUSCULAS (ID_HOSPITAL, NOME...).
// ESCRITA: o backend espera os nomes das colunas em minusculas (id_hospital...).

export type CampoTipo = 'text' | 'number' | 'date' | 'select'

export interface Campo {
  nome: string // minusculo, enviado ao backend
  rotulo: string
  tipo: CampoTipo
  obrigatorio?: boolean
  ajuda?: string
  numerico?: boolean // converte para Number antes de enviar
  opcoes?: { valor: string; rotulo: string }[] // select estatico
  origem?: string // recurso para select dinamico (ex.: '/api/hospitais')
  origemValor?: string // chave (MAIUSCULA) usada como value
  origemRotulo?: (row: any) => string
}

export interface Coluna {
  chave: string // chave MAIUSCULA da linha
  rotulo: string
  tipo?: 'status' | 'hora' | 'data'
}

export interface EntidadeConfig {
  slug: string
  titulo: string
  endpoint: string
  colunas: Coluna[]
  campos: Campo[]
  caminhoId: (row: any) => string
  semAtualizar?: boolean
  somenteLeitura?: boolean
}

const PERFIS_MEDICO = [
  { valor: 'Cirurgiao', rotulo: 'Cirurgiao' },
  { valor: 'Clinico', rotulo: 'Clinico' },
  { valor: 'Anestesista', rotulo: 'Anestesista' },
]

const URGENCIAS = [
  { valor: 'Eletiva', rotulo: 'Eletiva' },
  { valor: 'Urgencia', rotulo: 'Urgencia' },
  { valor: 'Emergencia', rotulo: 'Emergencia' },
]

export const CADASTROS: EntidadeConfig[] = [
  {
    slug: 'hospitais',
    titulo: 'Hospitais',
    endpoint: '/api/hospitais',
    colunas: [
      { chave: 'ID_HOSPITAL', rotulo: 'Codigo' },
      { chave: 'NOME', rotulo: 'Nome' },
      { chave: 'ENDERECO', rotulo: 'Endereco' },
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { nome: 'endereco', rotulo: 'Endereco', tipo: 'text', obrigatorio: true },
    ],
    caminhoId: (r) => `${r.ID_HOSPITAL}`,
  },
  {
    slug: 'blocos',
    titulo: 'Blocos',
    endpoint: '/api/blocos',
    colunas: [
      { chave: 'ID_HOSPITAL', rotulo: 'Hospital' },
      { chave: 'NUM_BLOCO', rotulo: 'Bloco' },
      { chave: 'DESCRICAO', rotulo: 'Descricao' },
    ],
    campos: [
      {
        nome: 'id_hospital',
        rotulo: 'Hospital',
        tipo: 'select',
        obrigatorio: true,
        numerico: true,
        origem: '/api/hospitais',
        origemValor: 'ID_HOSPITAL',
        origemRotulo: (r) => `${r.ID_HOSPITAL} - ${r.NOME}`,
      },
      { nome: 'num_bloco', rotulo: 'Numero do bloco', tipo: 'number', obrigatorio: true, numerico: true },
      { nome: 'descricao', rotulo: 'Descricao', tipo: 'text' },
    ],
    caminhoId: (r) => `${r.ID_HOSPITAL}/${r.NUM_BLOCO}`,
  },
  {
    slug: 'salas',
    titulo: 'Salas',
    endpoint: '/api/salas',
    colunas: [
      { chave: 'ID_HOSPITAL', rotulo: 'Hospital' },
      { chave: 'NUM_BLOCO', rotulo: 'Bloco' },
      { chave: 'NUM_SALA', rotulo: 'Sala' },
      { chave: 'STATUS', rotulo: 'Status', tipo: 'status' },
    ],
    campos: [
      { nome: 'id_hospital', rotulo: 'Hospital (codigo)', tipo: 'number', obrigatorio: true, numerico: true },
      { nome: 'num_bloco', rotulo: 'Bloco (numero)', tipo: 'number', obrigatorio: true, numerico: true },
      { nome: 'num_sala', rotulo: 'Sala (numero)', tipo: 'number', obrigatorio: true, numerico: true },
      {
        nome: 'status',
        rotulo: 'Status',
        tipo: 'select',
        opcoes: [
          { valor: 'Disponivel', rotulo: 'Disponivel' },
          { valor: 'Ocupada', rotulo: 'Ocupada' },
        ],
      },
    ],
    caminhoId: (r) => `${r.ID_HOSPITAL}/${r.NUM_BLOCO}/${r.NUM_SALA}`,
  },
  {
    slug: 'medicos',
    titulo: 'Medicos',
    endpoint: '/api/medicos',
    colunas: [
      { chave: 'CRM', rotulo: 'CRM' },
      { chave: 'NOME', rotulo: 'Nome' },
      { chave: 'EMAIL', rotulo: 'Email' },
      { chave: 'ESPECIALIDADE', rotulo: 'Especialidade' },
      { chave: 'PERFIL', rotulo: 'Perfil' },
    ],
    campos: [
      { nome: 'crm', rotulo: 'CRM', tipo: 'text', obrigatorio: true },
      { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { nome: 'email', rotulo: 'Email', tipo: 'text', obrigatorio: true },
      { nome: 'especialidade', rotulo: 'Especialidade', tipo: 'text', obrigatorio: true },
      { nome: 'perfil', rotulo: 'Perfil', tipo: 'select', obrigatorio: true, opcoes: PERFIS_MEDICO },
    ],
    caminhoId: (r) => `${r.CRM}`,
  },
  {
    slug: 'pacientes',
    titulo: 'Pacientes',
    endpoint: '/api/pacientes',
    colunas: [
      { chave: 'CPF', rotulo: 'CPF' },
      { chave: 'NOME', rotulo: 'Nome' },
      { chave: 'DATA_NASCIMENTO', rotulo: 'Nascimento', tipo: 'data' },
    ],
    campos: [
      { nome: 'cpf', rotulo: 'CPF', tipo: 'text', obrigatorio: true },
      { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { nome: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'date', obrigatorio: true },
    ],
    caminhoId: (r) => `${r.CPF}`,
  },
  {
    slug: 'tipos-cirurgia',
    titulo: 'Tipos de Cirurgia',
    endpoint: '/api/tipos-cirurgia',
    colunas: [
      { chave: 'COD_CIRURGIA', rotulo: 'Codigo' },
      { chave: 'NOME', rotulo: 'Nome' },
      { chave: 'DURACAO_ESTIMADA_MINUTOS', rotulo: 'Duracao (min)' },
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { nome: 'duracao_estimada_minutos', rotulo: 'Duracao estimada (minutos)', tipo: 'number', numerico: true },
    ],
    caminhoId: (r) => `${r.COD_CIRURGIA}`,
  },
  {
    slug: 'solicitacoes',
    titulo: 'Solicitacoes',
    endpoint: '/api/solicitacoes',
    colunas: [
      { chave: 'ID_SOLICITACAO', rotulo: 'Codigo' },
      { chave: 'ID_PACIENTE', rotulo: 'Paciente (CPF)' },
      { chave: 'ID_TIPO_CIRURGIA', rotulo: 'Tipo' },
      { chave: 'DATA_SOLICITACAO', rotulo: 'Data', tipo: 'data' },
      { chave: 'HORA_SOLICITACAO', rotulo: 'Hora', tipo: 'hora' },
      { chave: 'URGENCIA', rotulo: 'Urgencia' },
      { chave: 'STATUS', rotulo: 'Status', tipo: 'status' },
    ],
    campos: [
      {
        nome: 'id_medico_solicitante',
        rotulo: 'Medico solicitante',
        tipo: 'select',
        obrigatorio: true,
        origem: '/api/medicos',
        origemValor: 'CRM',
        origemRotulo: (r) => `${r.CRM} - ${r.NOME}`,
      },
      {
        nome: 'id_paciente',
        rotulo: 'Paciente',
        tipo: 'select',
        obrigatorio: true,
        origem: '/api/pacientes',
        origemValor: 'CPF',
        origemRotulo: (r) => `${r.NOME} (CPF ${r.CPF})`,
      },
      {
        nome: 'id_tipo_cirurgia',
        rotulo: 'Tipo de cirurgia',
        tipo: 'select',
        obrigatorio: true,
        numerico: true,
        origem: '/api/tipos-cirurgia',
        origemValor: 'COD_CIRURGIA',
        origemRotulo: (r) => `${r.NOME} (${r.DURACAO_ESTIMADA_MINUTOS ?? '?'} min)`,
      },
      { nome: 'data_solicitacao', rotulo: 'Data', tipo: 'date', obrigatorio: true },
      {
        nome: 'hora_solicitacao',
        rotulo: 'Hora (minutos do dia)',
        tipo: 'number',
        obrigatorio: true,
        numerico: true,
        ajuda: 'Minutos desde a meia-noite (480 = 08:00, 600 = 10:00).',
      },
      { nome: 'urgencia', rotulo: 'Urgencia', tipo: 'select', opcoes: URGENCIAS },
    ],
    caminhoId: (r) => `${r.ID_SOLICITACAO}`,
  },
  {
    slug: 'agendamentos',
    titulo: 'Agendamentos',
    endpoint: '/api/agendamentos',
    colunas: [
      { chave: 'ID_AGENDAMENTO', rotulo: 'Codigo' },
      { chave: 'ID_SOLICITACAO', rotulo: 'Solicitacao' },
      { chave: 'ID_HOSPITAL', rotulo: 'Hospital' },
      { chave: 'NUM_BLOCO', rotulo: 'Bloco' },
      { chave: 'NUM_SALA', rotulo: 'Sala' },
      { chave: 'DATA_AGENDAMENTO', rotulo: 'Data', tipo: 'data' },
      { chave: 'HORA_AGENDAMENTO', rotulo: 'Hora', tipo: 'hora' },
      { chave: 'STATUS', rotulo: 'Status', tipo: 'status' },
    ],
    campos: [
      {
        nome: 'id_solicitacao',
        rotulo: 'Solicitacao',
        tipo: 'select',
        obrigatorio: true,
        numerico: true,
        origem: '/api/solicitacoes',
        origemValor: 'ID_SOLICITACAO',
        origemRotulo: (r) => `#${r.ID_SOLICITACAO} (paciente ${r.ID_PACIENTE}, ${r.STATUS})`,
      },
      { nome: 'id_hospital', rotulo: 'Hospital (codigo)', tipo: 'number', obrigatorio: true, numerico: true },
      { nome: 'num_bloco', rotulo: 'Bloco (numero)', tipo: 'number', obrigatorio: true, numerico: true },
      { nome: 'num_sala', rotulo: 'Sala (numero)', tipo: 'number', obrigatorio: true, numerico: true },
      { nome: 'data_agendamento', rotulo: 'Data', tipo: 'date', obrigatorio: true },
      {
        nome: 'hora_agendamento',
        rotulo: 'Hora (minutos do dia)',
        tipo: 'number',
        obrigatorio: true,
        numerico: true,
        ajuda: 'Minutos desde a meia-noite (480 = 08:00).',
      },
    ],
    caminhoId: (r) => `${r.ID_AGENDAMENTO}`,
  },
  {
    slug: 'medicos-participantes',
    titulo: 'Medicos Participantes',
    endpoint: '/api/medicos-participantes',
    colunas: [
      { chave: 'ID_AGENDAMENTO', rotulo: 'Agendamento' },
      { chave: 'ID_MEDICO', rotulo: 'Medico (CRM)' },
    ],
    campos: [
      {
        nome: 'id_agendamento',
        rotulo: 'Agendamento',
        tipo: 'select',
        obrigatorio: true,
        numerico: true,
        origem: '/api/agendamentos',
        origemValor: 'ID_AGENDAMENTO',
        origemRotulo: (r) => `#${r.ID_AGENDAMENTO} (sala ${r.NUM_SALA}, ${r.STATUS})`,
      },
      {
        nome: 'id_medico',
        rotulo: 'Medico (cirurgiao)',
        tipo: 'select',
        obrigatorio: true,
        origem: '/api/medicos',
        origemValor: 'CRM',
        origemRotulo: (r) => `${r.CRM} - ${r.NOME} (${r.PERFIL})`,
      },
    ],
    semAtualizar: true,
    caminhoId: (r) => `${r.ID_AGENDAMENTO}/${r.ID_MEDICO}`,
  },
  {
    slug: 'notificacoes',
    titulo: 'Notificacoes',
    endpoint: '/api/notificacoes',
    colunas: [
      { chave: 'ID_NOTIFICACAO', rotulo: 'Codigo' },
      { chave: 'ID_AGENDAMENTO', rotulo: 'Agendamento' },
      { chave: 'MENSAGEM', rotulo: 'Mensagem' },
      { chave: 'DATA_ENVIO', rotulo: 'Enviada em', tipo: 'data' },
    ],
    campos: [],
    somenteLeitura: true,
    caminhoId: (r) => `${r.ID_NOTIFICACAO}`,
  },
]

export const CADASTRO_POR_SLUG = new Map(CADASTROS.map((c) => [c.slug, c]))
