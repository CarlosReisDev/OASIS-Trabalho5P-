import { Router } from 'express';
import * as svc from '../services/solicitacao.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { exigir, parseInteiro } from '../utils/parse.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => res.json(await svc.listar())));
router.get('/:id', asyncHandler(async (req, res) => res.json(await svc.buscar(parseInteiro(req.params.id, 'id')))));
router.post('/', asyncHandler(async (req, res) => res.status(201).json(await svc.criar(req.body))));
router.put('/:id', asyncHandler(async (req, res) => res.json(await svc.atualizar(parseInteiro(req.params.id, 'id'), req.body))));
router.put('/:id/status', asyncHandler(async (req, res) =>
  res.json(await svc.alterarStatus(parseInteiro(req.params.id, 'id'), exigir(req.body.status, 'status') as string)),
));
router.delete('/:id', asyncHandler(async (req, res) => {
  await svc.remover(parseInteiro(req.params.id, 'id'));
  res.status(204).end();
}));

export default router;
