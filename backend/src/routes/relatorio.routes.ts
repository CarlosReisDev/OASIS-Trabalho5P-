import { Router } from 'express';
import { catalogo, executarRelatorio } from '../reports/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => res.json(catalogo())));
router.get('/:nome', asyncHandler(async (req, res) =>
  res.json(await executarRelatorio(req.params.nome)),
));

export default router;
