import { Request, Response } from 'express';
import * as service from '../services/agendamento.service.js';
import { exigir, parseData, parseInteiro } from '../utils/parse.js';

function lerCorpo(body: any) {
  return {
    id_solicitacao: parseInteiro(exigir(body.id_solicitacao, 'id_solicitacao'), 'id_solicitacao'),
    num_sala: parseInteiro(exigir(body.num_sala, 'num_sala'), 'num_sala'),
    num_bloco: parseInteiro(exigir(body.num_bloco, 'num_bloco'), 'num_bloco'),
    id_hospital: parseInteiro(exigir(body.id_hospital, 'id_hospital'), 'id_hospital'),
    data_agendamento: parseData(exigir(body.data_agendamento, 'data_agendamento'), 'data_agendamento'),
    hora_agendamento: parseInteiro(exigir(body.hora_agendamento, 'hora_agendamento'), 'hora_agendamento'),
  };
}

export async function listar(_req: Request, res: Response) {
  res.json(await service.listar());
}

export async function buscar(req: Request, res: Response) {
  res.json(await service.buscar(parseInteiro(req.params.id, 'id')));
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(await service.criar(lerCorpo(req.body)));
}

export async function reagendar(req: Request, res: Response) {
  res.json(await service.reagendar(parseInteiro(req.params.id, 'id'), lerCorpo(req.body)));
}

export async function alterarStatus(req: Request, res: Response) {
  const status = exigir(req.body.status, 'status') as string;
  res.json(await service.alterarStatus(parseInteiro(req.params.id, 'id'), status));
}

export async function remover(req: Request, res: Response) {
  await service.remover(parseInteiro(req.params.id, 'id'));
  res.status(204).end();
}
