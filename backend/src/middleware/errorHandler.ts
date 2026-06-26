import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

interface OracleError extends Error {
  errorNum?: number;
}

// Mensagens dos RAISE_APPLICATION_ERROR dos triggers (faixa -20000) ja vem
// prontas do banco; aqui so definimos o status HTTP por codigo.
const STATUS_POR_ORA: Record<number, number> = {
  20002: 400, // alcada do cirurgiao
  20003: 409, // solicitacao ja finalizada
  20004: 400, // transicao invalida (solicitacao)
  20005: 409, // cirurgia cancelada
  20006: 400, // transicao invalida (agendamento)
};

function limparMensagemOra(msg: string): string {
  // Remove o prefixo "ORA-20002: " deixando so o texto do trigger.
  const m = msg.match(/ORA-\d+:\s*(.*)/);
  return m ? m[1].split('\n')[0].trim() : msg;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }

  const oraErr = err as OracleError;
  const num = oraErr.errorNum;

  if (num !== undefined) {
    if (num >= 20000 && num <= 20999) {
      res.status(STATUS_POR_ORA[num] ?? 400).json({ erro: limparMensagemOra(oraErr.message) });
      return;
    }
    if (num === 1) {
      res.status(409).json({ erro: 'Registro duplicado: viola restricao de unicidade.' });
      return;
    }
    if (num === 2291) {
      res.status(400).json({ erro: 'Referencia invalida: registro pai inexistente.' });
      return;
    }
    if (num === 2292) {
      res.status(409).json({ erro: 'Registro possui dependentes e nao pode ser removido.' });
      return;
    }
    if (num === 2290) {
      res.status(400).json({ erro: 'Valor viola uma restricao de validacao (CHECK).' });
      return;
    }
  }

  console.error('Erro nao tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}
