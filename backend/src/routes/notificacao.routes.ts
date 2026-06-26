import { Router } from 'express';
import { consultar } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseInteiro } from '../utils/parse.js';

// Read-only: Notificacao e gerada pelo trigger notifica_agendamento.
const router = Router();

router.get('/', asyncHandler(async (_req, res) =>
  res.json(await consultar(`SELECT * FROM Notificacao ORDER BY id_notificacao DESC`)),
));
router.get('/:id', asyncHandler(async (req, res) => {
  const r = await consultar(`SELECT * FROM Notificacao WHERE id_notificacao = :id`, {
    id: parseInteiro(req.params.id, 'id'),
  });
  if (r.length === 0) return res.status(404).json({ erro: 'Notificacao nao encontrada.' });
  res.json(r[0]);
}));

export default router;
