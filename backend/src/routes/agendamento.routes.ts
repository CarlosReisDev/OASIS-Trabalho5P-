import { Router } from 'express';
import * as ctrl from '../controllers/agendamento.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', asyncHandler(ctrl.buscar));
router.post('/', asyncHandler(ctrl.criar));
router.put('/:id', asyncHandler(ctrl.reagendar));
router.put('/:id/status', asyncHandler(ctrl.alterarStatus)); // cancelar/cancelamento logico
router.delete('/:id', asyncHandler(ctrl.remover));

export default router;
