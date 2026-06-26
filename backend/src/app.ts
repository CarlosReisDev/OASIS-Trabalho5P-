import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';

import agendamentoRoutes from './routes/agendamento.routes.js';
import blocoRoutes from './routes/bloco.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import medicoRoutes from './routes/medico.routes.js';
import medicosParticipantesRoutes from './routes/medicosParticipantes.routes.js';
import notificacaoRoutes from './routes/notificacao.routes.js';
import pacienteRoutes from './routes/paciente.routes.js';
import relatorioRoutes from './routes/relatorio.routes.js';
import salaRoutes from './routes/sala.routes.js';
import solicitacaoRoutes from './routes/solicitacao.routes.js';
import tipoCirurgiaRoutes from './routes/tipocirurgia.routes.js';

export function criarApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/hospitais', hospitalRoutes);
  app.use('/api/blocos', blocoRoutes);
  app.use('/api/salas', salaRoutes);
  app.use('/api/medicos', medicoRoutes);
  app.use('/api/pacientes', pacienteRoutes);
  app.use('/api/tipos-cirurgia', tipoCirurgiaRoutes);
  app.use('/api/solicitacoes', solicitacaoRoutes);
  app.use('/api/agendamentos', agendamentoRoutes);
  app.use('/api/medicos-participantes', medicosParticipantesRoutes);
  app.use('/api/notificacoes', notificacaoRoutes);
  app.use('/api/relatorios', relatorioRoutes);

  app.use((_req, res) => res.status(404).json({ erro: 'Rota nao encontrada.' }));
  app.use(errorHandler);

  return app;
}
