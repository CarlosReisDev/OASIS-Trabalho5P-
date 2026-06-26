-- Remove os triggers existentes. Ignora os que nao existem.
BEGIN
    FOR g IN (
        SELECT trigger_name FROM user_triggers
        WHERE trigger_name IN (
            'ALCADA_CIRURGIAO', 'STATUS_SOLICITACAO', 'NOTIFICA_AGENDAMENTO',
            'STATUS_AGENDAMENTO', 'LIBERA_SALA_CANCELAMENTO'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP TRIGGER ' || g.trigger_name;
    END LOOP;
END;
/

CREATE OR REPLACE TRIGGER alcada_cirurgiao
    BEFORE INSERT OR UPDATE ON MedicosParticipantes
    FOR EACH ROW
DECLARE
    v_perfil  VARCHAR2(50);
BEGIN
    -- busca o perfil do medico que esta sendo vinculado a cirurgia
    SELECT perfil
    INTO   v_perfil
    FROM   Medico
    WHERE  crm = :NEW.id_medico;

    -- so cirurgioes podem participar de um procedimento cirurgico
    IF UPPER(v_perfil) != 'CIRURGIAO' THEN
        RAISE_APPLICATION_ERROR(
            -20002,
            'Apenas medicos com perfil de cirurgiao podem participar de uma cirurgia agendada.'
        );
    END IF;
END;
/

CREATE OR REPLACE TRIGGER status_solicitacao
    BEFORE UPDATE OF status ON Solicitacao
    FOR EACH ROW
BEGIN
    -- uma solicitacao ja finalizada nao pode mudar de status
    IF :OLD.status IN ('Processada', 'Rejeitada') THEN
        RAISE_APPLICATION_ERROR(
            -20003,
            'Esta solicitacao ja foi finalizada e nao pode ter o status alterado.'
        );
    END IF;

    -- a partir de Pendente, so pode ir para Processada ou Rejeitada
    IF :OLD.status = 'Pendente'
       AND :NEW.status NOT IN ('Processada', 'Rejeitada') THEN
        RAISE_APPLICATION_ERROR(
            -20004,
            'Transicao de status invalida. De Pendente, so e permitido ir para Processada ou Rejeitada.'
        );
    END IF;
END;
/

CREATE OR REPLACE TRIGGER notifica_agendamento
    AFTER INSERT OR UPDATE OR DELETE ON Agendamento
    FOR EACH ROW
DECLARE
    v_mensagem  VARCHAR2(255);
    v_id_ag     NUMBER(5);
    v_novo_id   NUMBER(10);
BEGIN
    IF INSERTING THEN
        v_id_ag    := :NEW.id_agendamento;
        v_mensagem := 'Cirurgia agendada com sucesso. Agendamento numero ' || :NEW.id_agendamento;

    ELSIF UPDATING THEN
        v_id_ag    := :NEW.id_agendamento;
        v_mensagem := 'Cirurgia reagendada. Agendamento numero ' || :NEW.id_agendamento;

    ELSIF DELETING THEN
        v_id_ag    := :OLD.id_agendamento;
        v_mensagem := 'Cirurgia cancelada. Agendamento numero ' || :OLD.id_agendamento;
    END IF;

    -- gera o proximo id pegando o maior atual + 1
    SELECT NVL(MAX(id_notificacao), 0) + 1
    INTO   v_novo_id
    FROM   Notificacao;

    INSERT INTO Notificacao (id_notificacao, id_agendamento, mensagem)
    VALUES (v_novo_id, v_id_ag, v_mensagem);
END;
/

CREATE OR REPLACE TRIGGER status_agendamento
    BEFORE UPDATE OF status ON Agendamento
    FOR EACH ROW
BEGIN
    -- uma cirurgia cancelada esta encerrada e nao pode mais ser alterada
    IF :OLD.status = 'Cancelado' THEN
        RAISE_APPLICATION_ERROR(
            -20005,
            'Esta cirurgia foi cancelada e nao pode ser reagendada ou alterada.'
        );
    END IF;

    -- so e permitido sair de Agendado/Reagendado para Reagendado ou Cancelado
    IF :OLD.status IN ('Agendado', 'Reagendado')
       AND :NEW.status NOT IN ('Reagendado', 'Cancelado') THEN
        RAISE_APPLICATION_ERROR(
            -20006,
            'Transicao invalida. Uma cirurgia agendada so pode ser reagendada ou cancelada.'
        );
    END IF;
END;
/

CREATE OR REPLACE TRIGGER libera_sala_cancelamento
    AFTER UPDATE OF status ON Agendamento
    FOR EACH ROW
BEGIN
    -- quando a cirurgia passa para Cancelado, a sala volta a ficar disponivel
    IF :NEW.status = 'Cancelado' AND :OLD.status != 'Cancelado' THEN
        UPDATE Sala
        SET    status = 'Disponivel'
        WHERE  num_sala = :NEW.num_sala
          AND  num_bloco = :NEW.num_bloco
          AND  id_hospital = :NEW.id_hospital;
    END IF;
END;
/