import { consultar } from '../db.js';
import { Relatorio } from './Relatorio.js';

// 1 — JUNCAO INTERNA: agendamentos detalhados cruzando 5 tabelas.
export class AgendamentosDetalhados implements Relatorio {
  nome = 'agendamentos-detalhados';
  descricao = 'Agendamentos com paciente, medico, tipo de cirurgia e hospital.';
  tipoSql = 'Juncao interna (INNER JOIN)';
  executar() {
    return consultar(`
      SELECT a.id_agendamento, a.data_agendamento, a.hora_agendamento, a.status,
             p.nome AS paciente, m.nome AS medico_solicitante,
             t.nome AS tipo_cirurgia, t.duracao_estimada_minutos,
             h.nome AS hospital, a.num_bloco, a.num_sala
        FROM Agendamento a
        JOIN Solicitacao s   ON s.id_solicitacao = a.id_solicitacao
        JOIN Paciente p      ON p.cpf = s.id_paciente
        JOIN Medico m        ON m.crm = s.id_medico_solicitante
        JOIN TipoCirurgia t  ON t.cod_cirurgia = s.id_tipo_cirurgia
        JOIN Hospital h      ON h.id_hospital = a.id_hospital
       ORDER BY a.data_agendamento, a.hora_agendamento`);
  }
}

// 2 — JUNCAO EXTERNA: todas as salas, com ou sem agendamento ativo (inclui ociosas).
export class OcupacaoSalas implements Relatorio {
  nome = 'ocupacao-salas';
  descricao = 'Todas as salas e seus agendamentos ativos (salas ociosas inclusas).';
  tipoSql = 'Juncao externa (LEFT JOIN)';
  executar() {
    return consultar(`
      SELECT sa.id_hospital, sa.num_bloco, sa.num_sala, sa.status AS status_sala,
             a.id_agendamento, a.data_agendamento, a.hora_agendamento,
             a.status AS status_agendamento
        FROM Sala sa
        LEFT JOIN Agendamento a
          ON a.id_hospital = sa.id_hospital
         AND a.num_bloco   = sa.num_bloco
         AND a.num_sala    = sa.num_sala
         AND a.status     != 'Cancelado'
       ORDER BY sa.id_hospital, sa.num_bloco, sa.num_sala`);
  }
}

// 3 — GROUP BY: total de cirurgias agendadas por hospital.
export class CirurgiasPorHospital implements Relatorio {
  nome = 'cirurgias-por-hospital';
  descricao = 'Quantidade de cirurgias agendadas (nao canceladas) por hospital.';
  tipoSql = 'Agrupamento (GROUP BY)';
  executar() {
    return consultar(`
      SELECT h.id_hospital, h.nome AS hospital,
             COUNT(a.id_agendamento) AS total_cirurgias
        FROM Hospital h
        LEFT JOIN Agendamento a
          ON a.id_hospital = h.id_hospital AND a.status != 'Cancelado'
       GROUP BY h.id_hospital, h.nome
       ORDER BY total_cirurgias DESC`);
  }
}

// 4 — HAVING: tipos de cirurgia com mais de uma solicitacao.
export class TiposMaisSolicitados implements Relatorio {
  nome = 'tipos-mais-solicitados';
  descricao = 'Tipos de cirurgia com mais de uma solicitacao.';
  tipoSql = 'Agrupamento com filtro (GROUP BY + HAVING)';
  executar() {
    return consultar(`
      SELECT t.cod_cirurgia, t.nome AS tipo_cirurgia,
             COUNT(s.id_solicitacao) AS total_solicitacoes
        FROM TipoCirurgia t
        JOIN Solicitacao s ON s.id_tipo_cirurgia = t.cod_cirurgia
       GROUP BY t.cod_cirurgia, t.nome
      HAVING COUNT(s.id_solicitacao) > 1
       ORDER BY total_solicitacoes DESC`);
  }
}

// 5 — SUBCONSULTA ANINHADA: pacientes com agendamento acima da hora media.
export class PacientesAcimaDaMedia implements Relatorio {
  nome = 'pacientes-acima-da-media';
  descricao = 'Pacientes com cirurgia agendada em horario acima da media geral.';
  tipoSql = 'Subconsulta aninhada';
  executar() {
    return consultar(`
      SELECT DISTINCT p.cpf, p.nome, a.hora_agendamento
        FROM Paciente p
        JOIN Solicitacao s ON s.id_paciente = p.cpf
        JOIN Agendamento a ON a.id_solicitacao = s.id_solicitacao
       WHERE a.hora_agendamento >
             (SELECT AVG(hora_agendamento) FROM Agendamento WHERE status != 'Cancelado')
       ORDER BY a.hora_agendamento DESC`);
  }
}
