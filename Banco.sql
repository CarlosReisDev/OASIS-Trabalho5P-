-- Remove as tabelas existentes (ordem inversa das FKs). Ignora as que nao existem.
BEGIN
    FOR t IN (
        SELECT table_name FROM user_tables
        WHERE table_name IN (
            'NOTIFICACAO', 'MEDICOSPARTICIPANTES', 'AGENDAMENTO', 'SOLICITACAO',
            'TIPOCIRURGIA', 'PACIENTE', 'MEDICO', 'SALA', 'BLOCO', 'HOSPITAL'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
END;
/

CREATE TABLE Hospital (
    id_hospital NUMBER(5)     NOT NULL,
    nome        VARCHAR2(100) NOT NULL,
    endereco    VARCHAR2(255) NOT NULL,
    
    CONSTRAINT pk_hospital
    PRIMARY KEY (id_hospital)
);
 
CREATE TABLE Bloco (
    num_bloco   NUMBER(5) NOT NULL,
    id_hospital NUMBER(5) NOT NULL,
    descricao   VARCHAR2(255),
    
    CONSTRAINT fk_bloco_hospital
    FOREIGN KEY (id_hospital)
    REFERENCES Hospital(id_hospital)
    ON DELETE CASCADE, -- Apaga o bloco se o hospital não existir mais
    
    CONSTRAINT pk_bloco
    PRIMARY KEY (id_hospital, num_bloco)
);
 
CREATE TABLE Sala (
    num_sala    NUMBER(5)    NOT NULL,
    num_bloco   NUMBER(5)    NOT NULL,
    id_hospital NUMBER(5)    NOT NULL,
    status      VARCHAR2(30) NOT NULL,
    
    CONSTRAINT fk_sala_bloco
    FOREIGN KEY (num_bloco, id_hospital)
    REFERENCES Bloco(num_bloco, id_hospital)
    ON DELETE CASCADE, -- Apaga a sala se o bloco não existir mais
    
    CONSTRAINT pk_sala
    PRIMARY KEY (id_hospital, num_bloco, num_sala)
);
 
CREATE TABLE Medico (
    crm           VARCHAR2(20)  NOT NULL,
    nome          VARCHAR2(100) NOT NULL,
    email         VARCHAR2(255) NOT NULL,
    especialidade VARCHAR2(100) NOT NULL,
    perfil        VARCHAR2(50)  NOT NULL,
    
    CONSTRAINT pk_medico
    PRIMARY KEY (crm),
    
    CONSTRAINT uq_email_medico
    UNIQUE (email)
);
 
CREATE TABLE Paciente (
    cpf             VARCHAR2(14)  NOT NULL,
    nome            VARCHAR2(100) NOT NULL,
    data_nascimento DATE          NOT NULL,
    
    CONSTRAINT pk_paciente
    PRIMARY KEY (cpf)
);
 
CREATE TABLE TipoCirurgia (
    cod_cirurgia             NUMBER(5)     NOT NULL,
    nome                     VARCHAR2(100) NOT NULL,
    duracao_estimada_minutos NUMBER(5),
    
    CONSTRAINT pk_tipocirurgia
    PRIMARY KEY (cod_cirurgia)
);
 
CREATE TABLE Solicitacao (
    id_solicitacao        NUMBER(5)    NOT NULL, -- Chave artificial (evitar redundância e facilitar manutenção do banco)
    id_medico_solicitante VARCHAR2(20) NOT NULL,
    id_paciente           VARCHAR2(14) NOT NULL,
    id_tipo_cirurgia      NUMBER(5)    NOT NULL,
    data_solicitacao      DATE         NOT NULL,
    hora_solicitacao      NUMBER(5)    NOT NULL,
    urgencia              VARCHAR2(30),
    status                VARCHAR2(30) DEFAULT 'Pendente' NOT NULL,
    
    CONSTRAINT pk_solicitacao
    PRIMARY KEY (id_solicitacao),
    
    CONSTRAINT fk_solicitacao_medico
    FOREIGN KEY (id_medico_solicitante)
    REFERENCES Medico(crm),
    
    CONSTRAINT fk_solicitacao_paciente
    FOREIGN KEY (id_paciente)
    REFERENCES Paciente(cpf),
    
    CONSTRAINT fk_solicitacao_tipo
    FOREIGN KEY (id_tipo_cirurgia)
    REFERENCES TipoCirurgia(cod_cirurgia),
    
    CONSTRAINT uq_solicitacao -- Chave real
    UNIQUE (id_medico_solicitante, id_paciente, id_tipo_cirurgia, data_solicitacao, hora_solicitacao),

    CONSTRAINT ck_hora_solicitacao -- minutos desde a meia-noite (00:00 a 23:59)
    CHECK (hora_solicitacao BETWEEN 0 AND 1439)
);
 
CREATE TABLE Agendamento (
    id_agendamento   NUMBER(5) NOT NULL, -- Chave artificial
    id_solicitacao   NUMBER(5) NOT NULL,
    num_sala         NUMBER(5) NOT NULL,
    num_bloco        NUMBER(5) NOT NULL,
    id_hospital      NUMBER(5) NOT NULL,
    data_agendamento DATE      NOT NULL,
    hora_agendamento NUMBER(5) NOT NULL,
    status           VARCHAR2(30) DEFAULT 'Agendado' NOT NULL,
    
    CONSTRAINT pk_agendamento
    PRIMARY KEY (id_agendamento),
    
    CONSTRAINT fk_agendamento_solicitacao
    FOREIGN KEY (id_solicitacao)
    REFERENCES Solicitacao(id_solicitacao),
    
    CONSTRAINT fk_agendamento_sala
    FOREIGN KEY (num_sala, num_bloco, id_hospital)
    REFERENCES Sala(num_sala, num_bloco, id_hospital),
    
    CONSTRAINT uq_agendamento_solicitacao -- Chave real
    UNIQUE (id_solicitacao),
    
    CONSTRAINT uq_agendamento_sala
    UNIQUE (num_sala, num_bloco, id_hospital, data_agendamento, hora_agendamento),

    CONSTRAINT ck_hora_agendamento -- minutos desde a meia-noite (00:00 a 23:59)
    CHECK (hora_agendamento BETWEEN 0 AND 1439)
);
 
CREATE TABLE MedicosParticipantes (
    id_agendamento NUMBER(5)    NOT NULL,
    id_medico      VARCHAR2(20) NOT NULL,
    
    CONSTRAINT pk_medicos_participantes
    PRIMARY KEY (id_agendamento, id_medico),
    
    CONSTRAINT fk_mp_agendamento
    FOREIGN KEY (id_agendamento)
    REFERENCES Agendamento(id_agendamento),
    
    CONSTRAINT fk_mp_medico
    FOREIGN KEY (id_medico)
    REFERENCES Medico(crm)
);

CREATE TABLE Notificacao (
    id_notificacao  NUMBER(10)    NOT NULL,
    id_agendamento  NUMBER(5)     NOT NULL,
    mensagem        VARCHAR2(255) NOT NULL,
    data_envio      DATE          DEFAULT SYSDATE NOT NULL,

    CONSTRAINT pk_notificacao
    PRIMARY KEY (id_notificacao),

    CONSTRAINT fk_notif_agendamento
    FOREIGN KEY (id_agendamento)
    REFERENCES Agendamento(id_agendamento)
);
