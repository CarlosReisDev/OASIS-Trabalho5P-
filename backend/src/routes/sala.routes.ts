import { Router } from 'express';
import * as svc from '../services/sala.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseInteiro } from '../utils/parse.js';

const router = Router();
const p = (req: any) => [
  parseInteiro(req.params.h, 'id_hospital'),
  parseInteiro(req.params.b, 'num_bloco'),
  parseInteiro(req.params.s, 'num_sala'),
] as const;

router.get('/', asyncHandler(async (_req, res) => res.json(await svc.listar())));
router.get('/:h/:b/:s', asyncHandler(async (req, res) => res.json(await svc.buscar(...p(req)))));
router.post('/', asyncHandler(async (req, res) => res.status(201).json(await svc.criar(req.body))));
router.put('/:h/:b/:s', asyncHandler(async (req, res) => res.json(await svc.atualizar(...p(req), req.body))));
router.delete('/:h/:b/:s', asyncHandler(async (req, res) => {
  await svc.remover(...p(req));
  res.status(204).end();
}));

export default router;
