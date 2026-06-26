-- Povoamento OASIS — minimo 5 registros por tabela.
-- Convencoes: strings sem acento e primeira letra maiuscula; horas em MINUTOS
-- desde a meia-noite (480 = 08:00). Notificacao NAO e povoada aqui: o trigger
-- notifica_agendamento gera uma notificacao a cada INSERT em Agendamento.
-- Rodar DEPOIS de Banco.sql e Triggers.sql.

-- =========================== Hospital ===========================
INSERT INTO Hospital (id_hospital, nome, endereco) VALUES (1, 'Hospital Joao XXIII', 'Av. Alfredo Balena, 400 - Belo Horizonte');
INSERT INTO Hospital (id_hospital, nome, endereco) VALUES (2, 'Hospital Maria Amelia Lins', 'Alameda Vereador Alvaro Celso, 100 - Belo Horizonte');
INSERT INTO Hospital (id_hospital, nome, endereco) VALUES (3, 'Hospital Risoleta Neves', 'R. das Gabirobas, 01 - Belo Horizonte');
INSERT INTO Hospital (id_hospital, nome, endereco) VALUES (4, 'Hospital Odilon Behrens', 'R. Formiga, 50 - Belo Horizonte');
INSERT INTO Hospital (id_hospital, nome, endereco) VALUES (5, 'Hospital Julia Kubitschek', 'Av. Prof. Alfredo Balena, 190 - Belo Horizonte');

-- ============================ Bloco =============================
INSERT INTO Bloco (id_hospital, num_bloco, descricao) VALUES (1, 1, 'Bloco Cirurgico A');
INSERT INTO Bloco (id_hospital, num_bloco, descricao) VALUES (1, 2, 'Bloco Cirurgico B');
INSERT INTO Bloco (id_hospital, num_bloco, descricao) VALUES (2, 1, 'Centro Cirurgico');
INSERT INTO Bloco (id_hospital, num_bloco, descricao) VALUES (3, 1, 'Ala Cirurgica');
INSERT INTO Bloco (id_hospital, num_bloco, descricao) VALUES (4, 1, 'Bloco Principal');
INSERT INTO Bloco (id_hospital, num_bloco, descricao) VALUES (5, 1, 'Centro Cirurgico');

-- ============================= Sala =============================
INSERT INTO Sala (id_hospital, num_bloco, num_sala, status) VALUES (1, 1, 1, 'Ocupada');
INSERT INTO Sala (id_hospital, num_bloco, num_sala, status) VALUES (1, 1, 2, 'Ocupada');
INSERT INTO Sala (id_hospital, num_bloco, num_sala, status) VALUES (1, 2, 1, 'Disponivel');
INSERT INTO Sala (id_hospital, num_bloco, num_sala, status) VALUES (2, 1, 1, 'Ocupada');
INSERT INTO Sala (id_hospital, num_bloco, num_sala, status) VALUES (3, 1, 1, 'Ocupada');
INSERT INTO Sala (id_hospital, num_bloco, num_sala, status) VALUES (4, 1, 1, 'Ocupada');
INSERT INTO Sala (id_hospital, num_bloco, num_sala, status) VALUES (5, 1, 1, 'Disponivel');

-- ============================ Medico ============================
INSERT INTO Medico (crm, nome, email, especialidade, perfil) VALUES ('CRM-MG-1001', 'Joao Mendes', 'joao.mendes@oasis.com', 'Cirurgia Cardiaca', 'Cirurgiao');
INSERT INTO Medico (crm, nome, email, especialidade, perfil) VALUES ('CRM-MG-1002', 'Maria Tavares', 'maria.tavares@oasis.com', 'Ortopedia', 'Cirurgiao');
INSERT INTO Medico (crm, nome, email, especialidade, perfil) VALUES ('CRM-MG-1003', 'Carlos Vieira', 'carlos.vieira@oasis.com', 'Neurocirurgia', 'Cirurgiao');
INSERT INTO Medico (crm, nome, email, especialidade, perfil) VALUES ('CRM-MG-1004', 'Ana Furtado', 'ana.furtado@oasis.com', 'Anestesiologia', 'Anestesista');
INSERT INTO Medico (crm, nome, email, especialidade, perfil) VALUES ('CRM-MG-1005', 'Pedro Antunes', 'pedro.antunes@oasis.com', 'Clinica Geral', 'Clinico');
INSERT INTO Medico (crm, nome, email, especialidade, perfil) VALUES ('CRM-MG-1006', 'Beatriz Rocha', 'beatriz.rocha@oasis.com', 'Cirurgia Geral', 'Cirurgiao');

-- =========================== Paciente ===========================
INSERT INTO Paciente (cpf, nome, data_nascimento) VALUES ('11122233344', 'Roberto Lima', TO_DATE('05/03/1980', 'DD/MM/YYYY'));
INSERT INTO Paciente (cpf, nome, data_nascimento) VALUES ('22233344455', 'Fernanda Souza', TO_DATE('12/07/1992', 'DD/MM/YYYY'));
INSERT INTO Paciente (cpf, nome, data_nascimento) VALUES ('33344455566', 'Marcos Pereira', TO_DATE('23/11/1975', 'DD/MM/YYYY'));
INSERT INTO Paciente (cpf, nome, data_nascimento) VALUES ('44455566677', 'Juliana Castro', TO_DATE('30/01/1988', 'DD/MM/YYYY'));
INSERT INTO Paciente (cpf, nome, data_nascimento) VALUES ('55566677788', 'Antonio Ramos', TO_DATE('17/09/1965', 'DD/MM/YYYY'));
INSERT INTO Paciente (cpf, nome, data_nascimento) VALUES ('66677788899', 'Camila Dias', TO_DATE('08/04/2000', 'DD/MM/YYYY'));

-- ========================= TipoCirurgia =========================
INSERT INTO TipoCirurgia (cod_cirurgia, nome, duracao_estimada_minutos) VALUES (1, 'Apendicectomia', 60);
INSERT INTO TipoCirurgia (cod_cirurgia, nome, duracao_estimada_minutos) VALUES (2, 'Artroplastia de Joelho', 120);
INSERT INTO TipoCirurgia (cod_cirurgia, nome, duracao_estimada_minutos) VALUES (3, 'Craniotomia', 240);
INSERT INTO TipoCirurgia (cod_cirurgia, nome, duracao_estimada_minutos) VALUES (4, 'Colecistectomia', 90);
INSERT INTO TipoCirurgia (cod_cirurgia, nome, duracao_estimada_minutos) VALUES (5, 'Hernia Inguinal', 75);

-- ========================== Solicitacao =========================
-- 5 Processadas (viram agendamento), 1 Pendente, 1 Rejeitada.
INSERT INTO Solicitacao (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao, urgencia, status)
VALUES (1, 'CRM-MG-1001', '11122233344', 1, TO_DATE('10/06/2026', 'DD/MM/YYYY'), 480, 'Alta', 'Processada');
INSERT INTO Solicitacao (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao, urgencia, status)
VALUES (2, 'CRM-MG-1002', '22233344455', 2, TO_DATE('11/06/2026', 'DD/MM/YYYY'), 540, 'Media', 'Processada');
INSERT INTO Solicitacao (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao, urgencia, status)
VALUES (3, 'CRM-MG-1003', '33344455566', 3, TO_DATE('11/06/2026', 'DD/MM/YYYY'), 600, 'Alta', 'Processada');
INSERT INTO Solicitacao (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao, urgencia, status)
VALUES (4, 'CRM-MG-1006', '44455566677', 4, TO_DATE('12/06/2026', 'DD/MM/YYYY'), 510, 'Baixa', 'Processada');
INSERT INTO Solicitacao (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao, urgencia, status)
VALUES (5, 'CRM-MG-1001', '55566677788', 5, TO_DATE('12/06/2026', 'DD/MM/YYYY'), 720, 'Media', 'Processada');
INSERT INTO Solicitacao (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao, urgencia, status)
VALUES (6, 'CRM-MG-1002', '11122233344', 2, TO_DATE('13/06/2026', 'DD/MM/YYYY'), 660, 'Baixa', 'Pendente');
INSERT INTO Solicitacao (id_solicitacao, id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao, urgencia, status)
VALUES (7, 'CRM-MG-1003', '22233344455', 3, TO_DATE('13/06/2026', 'DD/MM/YYYY'), 800, 'Alta', 'Rejeitada');

-- ========================= Agendamento ==========================
-- Cada INSERT dispara o trigger notifica_agendamento (gera 1 Notificacao).
INSERT INTO Agendamento (id_agendamento, id_solicitacao, num_sala, num_bloco, id_hospital, data_agendamento, hora_agendamento, status)
VALUES (1, 1, 1, 1, 1, TO_DATE('15/06/2026', 'DD/MM/YYYY'), 480, 'Agendado');
INSERT INTO Agendamento (id_agendamento, id_solicitacao, num_sala, num_bloco, id_hospital, data_agendamento, hora_agendamento, status)
VALUES (2, 2, 2, 1, 1, TO_DATE('15/06/2026', 'DD/MM/YYYY'), 540, 'Agendado');
INSERT INTO Agendamento (id_agendamento, id_solicitacao, num_sala, num_bloco, id_hospital, data_agendamento, hora_agendamento, status)
VALUES (3, 3, 1, 1, 2, TO_DATE('16/06/2026', 'DD/MM/YYYY'), 600, 'Agendado');
INSERT INTO Agendamento (id_agendamento, id_solicitacao, num_sala, num_bloco, id_hospital, data_agendamento, hora_agendamento, status)
VALUES (4, 4, 1, 1, 3, TO_DATE('16/06/2026', 'DD/MM/YYYY'), 510, 'Agendado');
INSERT INTO Agendamento (id_agendamento, id_solicitacao, num_sala, num_bloco, id_hospital, data_agendamento, hora_agendamento, status)
VALUES (5, 5, 1, 1, 4, TO_DATE('17/06/2026', 'DD/MM/YYYY'), 720, 'Agendado');

-- ===================== MedicosParticipantes =====================
-- So perfil 'Cirurgiao' (trigger alcada_cirurgiao).
INSERT INTO MedicosParticipantes (id_agendamento, id_medico) VALUES (1, 'CRM-MG-1001');
INSERT INTO MedicosParticipantes (id_agendamento, id_medico) VALUES (1, 'CRM-MG-1006');
INSERT INTO MedicosParticipantes (id_agendamento, id_medico) VALUES (2, 'CRM-MG-1002');
INSERT INTO MedicosParticipantes (id_agendamento, id_medico) VALUES (3, 'CRM-MG-1003');
INSERT INTO MedicosParticipantes (id_agendamento, id_medico) VALUES (3, 'CRM-MG-1001');
INSERT INTO MedicosParticipantes (id_agendamento, id_medico) VALUES (4, 'CRM-MG-1006');
INSERT INTO MedicosParticipantes (id_agendamento, id_medico) VALUES (5, 'CRM-MG-1001');

COMMIT;
