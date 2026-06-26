import { Router } from 'express';
import { CrudService } from '../services/crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseInteiro } from '../utils/parse.js';

/** Gera rotas REST padrao a partir de um CrudService. */
export function criarRouter(svc: CrudService, opts: { pkNumerica?: boolean } = {}): Router {
  const router = Router();
  const conv = (v: string) => (opts.pkNumerica ? parseInteiro(v, 'id') : v);

  router.get('/', asyncHandler(async (_req, res) => res.json(await svc.listar())));
  router.get('/:id', asyncHandler(async (req, res) => res.json(await svc.buscar(conv(req.params.id)))));
  router.post('/', asyncHandler(async (req, res) => res.status(201).json(await svc.criar(req.body))));
  router.put('/:id', asyncHandler(async (req, res) => res.json(await svc.atualizar(conv(req.params.id), req.body))));
  router.delete('/:id', asyncHandler(async (req, res) => {
    await svc.remover(conv(req.params.id));
    res.status(204).end();
  }));

  return router;
}
