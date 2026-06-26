import oracledb from 'oracledb';

export interface DadosAgendamento {
  id_agendamento?: number; // presente em reagendamento (ignora a si mesmo no conflito)
  id_solicitacao: number;
  num_sala: number;
  num_bloco: number;
  id_hospital: number;
  data_agendamento: Date;
  hora_agendamento: number;
}

export interface ContextoAgendamento {
  conn: oracledb.Connection;
  dados: DadosAgendamento;
  duracao?: number; // minutos, preenchido pelo SolicitacaoProcessadaHandler
}

// CHAIN OF RESPONSIBILITY — base. Cada elo valida um aspecto e, se passar,
// delega ao proximo via super.tratar(). Falha lanca AppError e interrompe a cadeia.
export abstract class Handler {
  private proximo?: Handler;

  encadear(h: Handler): Handler {
    this.proximo = h;
    return h; // permite encadear(a).encadear(b)
  }

  async tratar(ctx: ContextoAgendamento): Promise<void> {
    if (this.proximo) await this.proximo.tratar(ctx);
  }
}
