import { Router } from 'express';
import * as svc from '../services/bloco.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseInteiro } from '../utils/parse.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => res.json(await svc.listar())));
router.get('/:idHospital/:numBloco', asyncHandler(async (req, res) =>
  res.json(await svc.buscar(parseInteiro(req.params.idHospital, 'idHospital'), parseInteiro(req.params.numBloco, 'numBloco'))),
));
router.post('/', asyncHandler(async (req, res) => res.status(201).json(await svc.criar(req.body))));
router.put('/:idHospital/:numBloco', asyncHandler(async (req, res) =>
  res.json(await svc.atualizar(parseInteiro(req.params.idHospital, 'idHospital'), parseInteiro(req.params.numBloco, 'numBloco'), req.body)),
));
router.delete('/:idHospital/:numBloco', asyncHandler(async (req, res) => {
  await svc.remover(parseInteiro(req.params.idHospital, 'idHospital'), parseInteiro(req.params.numBloco, 'numBloco'));
  res.status(204).end();
}));

export default router;
