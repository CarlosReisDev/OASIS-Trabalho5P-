import { AppError } from '../utils/AppError.js';
import { Relatorio } from './Relatorio.js';
import {
  AgendamentosDetalhados,
  CirurgiasPorHospital,
  OcupacaoSalas,
  PacientesAcimaDaMedia,
  TiposMaisSolicitados,
} from './estrategias.js';

const lista: Relatorio[] = [
  new AgendamentosDetalhados(),
  new OcupacaoSalas(),
  new CirurgiasPorHospital(),
  new TiposMaisSolicitados(),
  new PacientesAcimaDaMedia(),
];

const registro = new Map<string, Relatorio>(lista.map((r) => [r.nome, r]));

/** Catalogo dos relatorios disponiveis (sem executar). */
export function catalogo() {
  return lista.map(({ nome, descricao, tipoSql }) => ({ nome, descricao, tipoSql }));
}

export async function executarRelatorio(nome: string) {
  const r = registro.get(nome);
  if (!r) throw new AppError(404, `Relatorio "${nome}" nao existe.`);
  return { nome: r.nome, tipoSql: r.tipoSql, dados: await r.executar() };
}
