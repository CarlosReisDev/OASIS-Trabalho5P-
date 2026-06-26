// STRATEGY — cada relatorio e um algoritmo intercambiavel com a mesma interface.
export interface Relatorio {
  readonly nome: string;
  readonly descricao: string;
  readonly tipoSql: string; // recurso SQL exigido demonstrado
  executar(): Promise<any[]>;
}
