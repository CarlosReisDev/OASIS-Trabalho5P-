import { AppError } from '../../utils/AppError.js';

// STATE — transicoes de status validas. Espelha os triggers do banco
// (status_solicitacao e status_agendamento), validando antes do UPDATE
// para dar erro amigavel; o trigger continua sendo a rede de seguranca.

export type StatusSolicitacao = 'Pendente' | 'Processada' | 'Rejeitada';
export type StatusAgendamento = 'Agendado' | 'Reagendado' | 'Cancelado';

const TRANSICOES_SOLICITACAO: Record<string, string[]> = {
  Pendente: ['Processada', 'Rejeitada'],
  Processada: [], // terminal
  Rejeitada: [], // terminal
};

const TRANSICOES_AGENDAMENTO: Record<string, string[]> = {
  Agendado: ['Reagendado', 'Cancelado'],
  Reagendado: ['Reagendado', 'Cancelado'],
  Cancelado: [], // terminal
};

function validar(
  tabela: Record<string, string[]>,
  de: string,
  para: string,
  rotulo: string,
): void {
  const permitidos = tabela[de];
  if (permitidos === undefined) {
    throw new AppError(400, `Status atual desconhecido em ${rotulo}: "${de}".`);
  }
  if (de === para) return; // no-op
  if (!permitidos.includes(para)) {
    throw new AppError(
      409,
      `Transicao invalida em ${rotulo}: de "${de}" para "${para}" nao e permitida.`,
    );
  }
}

export function validarTransicaoSolicitacao(de: string, para: string): void {
  validar(TRANSICOES_SOLICITACAO, de, para, 'Solicitacao');
}

export function validarTransicaoAgendamento(de: string, para: string): void {
  validar(TRANSICOES_AGENDAMENTO, de, para, 'Agendamento');
}
