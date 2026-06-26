import { Router } from 'express';
import * as svc from '../services/medicosParticipantes.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseInteiro } from '../utils/parse.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => res.json(await svc.listar())));
router.get('/agendamento/:id', asyncHandler(async (req, res) =>
  res.json(await svc.listarPorAgendamento(parseInteiro(req.params.id, 'id'))),
));
router.post('/', asyncHandler(async (req, res) => res.status(201).json(await svc.criar(req.body))));
router.delete('/:idAgendamento/:idMedico', asyncHandler(async (req, res) => {
  await svc.remover(parseInteiro(req.params.idAgendamento, 'idAgendamento'), req.params.idMedico);
  res.status(204).end();
}));

export default router;
