# Contexto do Projeto — Sistema OASIS (Agendamento Cirúrgico)

Este documento traz o estado atual de um trabalho de Banco de Dados I / Laboratório de BD I.
Use-o para continuar o desenvolvimento sem perder decisões já tomadas.

---

## 1. O que é o trabalho

Trabalho prático de BD I + LBD I (CEFET-MG). Tema: **OASIS**, um sistema web de
agendamento cirúrgico para dois hospitais (João XXIII e Maria Amélia Lins).

Entregáveis exigidos pelo trabalho:
1. Descrição textual do banco (30–60 linhas, mín. 8 regras de negócio)
2. Diagrama ER (ferramenta DIA, mín. 5 entidades)
3. Banco relacional no Oracle, com regras de negócio em DDL + **mínimo de 5 triggers**
4. Povoamento: mín. 5 registros por tabela
5. Sistema web (PHP sugerido) com:
   - CRUD em todas as tabelas
   - Relatórios SQL: junção interna, junção externa, GROUP BY, HAVING, subconsulta aninhada
   - Vídeo de 5–10 min demonstrando o sistema

Ambiente: **Oracle na nuvem** (login/senha já disponíveis, permissão para criar tabelas).
A UI será refeita do zero — não reaproveitar protótipos antigos.

---

## 2. Esquema do banco (DDL base)

O DDL original tem estas tabelas:
`Hospital`, `Bloco`, `Sala`, `Medico`, `Paciente`, `TipoCirurgia`,
`Solicitacao`, `Agendamento`, `MedicosParticipantes`.

Relações principais:
- Hospital 1—N Bloco 1—N Sala (PKs compostas em cascata)
- Medico faz Solicitacao para um Paciente, de um TipoCirurgia
- Solicitacao 1—1 Agendamento (constraint UNIQUE garante isso)
- Agendamento ocupa uma Sala
- MedicosParticipantes: N—N entre Agendamento e Medico

### Decisões e alterações ao DDL já definidas (AINDA NÃO RODADAS)

O banco ainda não foi criado. Integrar estas mudanças ao DDL antes de rodar:

1. **`hora_agendamento` e `hora_solicitacao` tratados como MINUTOS desde a meia-noite.**
   Ex.: 480 = 08:00, 600 = 10:00, 870 = 14:30. Tipo permanece `NUMBER(5)`.
   Escolhido para facilitar aritmética de intervalo (fim = hora + duracao_estimada_minutos).

2. **Adicionar coluna `status` em `Solicitacao`:**
   ```sql
   status VARCHAR2(30) DEFAULT 'Pendente' NOT NULL
   ```
   Valores válidos: 'Pendente', 'Processada', 'Rejeitada'.

3. **Adicionar coluna `status` em `Agendamento`:**
   ```sql
   status VARCHAR2(30) DEFAULT 'Agendado' NOT NULL
   ```
   Valores válidos: 'Agendado', 'Reagendado', 'Cancelado'.

4. **`Sala` já tem coluna `status`** no DDL original. Valor para sala livre: 'Disponivel'.

5. **Criar tabela nova `Notificacao`** (depois de `Agendamento`, por causa da FK):
   ```sql
   CREATE TABLE Notificacao (
       id_notificacao  NUMBER(10)    NOT NULL,
       id_agendamento  NUMBER(5)     NOT NULL,
       mensagem        VARCHAR2(255) NOT NULL,
       data_envio      DATE          DEFAULT SYSDATE NOT NULL,
       CONSTRAINT pk_notificacao PRIMARY KEY (id_notificacao),
       CONSTRAINT fk_notif_agendamento
           FOREIGN KEY (id_agendamento) REFERENCES Agendamento(id_agendamento)
   );
   ```

6. **Cancelamento é exclusão LÓGICA** (UPDATE de status para 'Cancelado'),
   nunca DELETE físico. Isso é importante para os triggers funcionarem.

---

## 3. Convenções importantes (NÃO QUEBRAR)

- **Padrão de strings de domínio: sem acento, primeira letra maiúscula.**
  Ex.: 'Pendente', 'Processada', 'Rejeitada', 'Agendado', 'Reagendado',
  'Cancelado', 'Disponivel', 'Cirurgiao'.
  Os triggers comparam strings literais — qualquer divergência de acento/caixa
  faz o trigger silenciosamente não disparar. O povoamento DEVE usar idêntico.

- **Estilo de trigger imposto pelo professor** (material de aula): triggers de
  sentença e de linha (`FOR EACH ROW`), com `:NEW`/`:OLD`,
  `RAISE_APPLICATION_ERROR` (faixa -20000 a -20999), e predicados
  `INSERTING`/`UPDATING`/`DELETING`. **NÃO usar compound trigger**
  (não foi ensinado). **NÃO usar `%TYPE`** (preferência do autor — declarar
  tipos explícitos). **Evitar SEQUENCE** se possível (usar MAX+1; aceitável
  para trabalho de faculdade, ver trigger de notificação).

- **Ordem do script:** criar TODAS as tabelas primeiro, triggers depois.
  Trigger não compila se a tabela referenciada não existe.

---

## 4. Os 5 triggers (já definidos, estilo do professor)

Validação de conflito de horário fica no PHP (decisão tomada para evitar
mutating table no estilo do professor). Os 5 triggers são:

### Trigger 1 — Alçada do cirurgião (RN02)
Só médico com perfil 'Cirurgiao' pode ser vinculado como participante.
```sql
CREATE OR REPLACE TRIGGER trg_alcada_cirurgiao
    BEFORE INSERT OR UPDATE ON MedicosParticipantes
    FOR EACH ROW
DECLARE
    v_perfil  VARCHAR2(50);
BEGIN
    SELECT perfil INTO v_perfil
    FROM   Medico
    WHERE  crm = :NEW.id_medico;

    IF UPPER(v_perfil) != 'CIRURGIAO' THEN
        RAISE_APPLICATION_ERROR(-20002,
            'Apenas medicos com perfil de cirurgiao podem participar de uma cirurgia agendada.');
    END IF;
END;
/
```

### Trigger 2 — Transição de status da Solicitacao
```sql
CREATE OR REPLACE TRIGGER trg_status_solicitacao
    BEFORE UPDATE OF status ON Solicitacao
    FOR EACH ROW
BEGIN
    IF :OLD.status IN ('Processada', 'Rejeitada') THEN
        RAISE_APPLICATION_ERROR(-20003,
            'Esta solicitacao ja foi finalizada e nao pode ter o status alterado.');
    END IF;

    IF :OLD.status = 'Pendente'
       AND :NEW.status NOT IN ('Processada', 'Rejeitada') THEN
        RAISE_APPLICATION_ERROR(-20004,
            'Transicao de status invalida. De Pendente, so e permitido ir para Processada ou Rejeitada.');
    END IF;
END;
/
```

### Trigger 3 — Notificação de mudança de status (RN03)
AFTER em Agendamento, grava em Notificacao. Usa MAX+1 (sem sequence).
Cuidado: no DELETE usar `:OLD` (mas cancelamento é UPDATE, então DELETE raro).
```sql
CREATE OR REPLACE TRIGGER trg_notifica_agendamento
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

    SELECT NVL(MAX(id_notificacao), 0) + 1 INTO v_novo_id FROM Notificacao;

    INSERT INTO Notificacao (id_notificacao, id_agendamento, mensagem)
    VALUES (v_novo_id, v_id_ag, v_mensagem);
END;
/
```

### Trigger 4 — Transição de status do Agendamento
```sql
CREATE OR REPLACE TRIGGER trg_status_agendamento
    BEFORE UPDATE OF status ON Agendamento
    FOR EACH ROW
BEGIN
    IF :OLD.status = 'Cancelado' THEN
        RAISE_APPLICATION_ERROR(-20005,
            'Esta cirurgia foi cancelada e nao pode ser reagendada ou alterada.');
    END IF;

    IF :OLD.status IN ('Agendado', 'Reagendado')
       AND :NEW.status NOT IN ('Reagendado', 'Cancelado') THEN
        RAISE_APPLICATION_ERROR(-20006,
            'Transicao invalida. Uma cirurgia agendada so pode ser reagendada ou cancelada.');
    END IF;
END;
/
```

### Trigger 5 — Libera sala ao cancelar
```sql
CREATE OR REPLACE TRIGGER trg_libera_sala_cancelamento
    AFTER UPDATE OF status ON Agendamento
    FOR EACH ROW
BEGIN
    IF :NEW.status = 'Cancelado' AND :OLD.status != 'Cancelado' THEN
        UPDATE Sala
        SET    status = 'Disponivel'
        WHERE  num_sala    = :NEW.num_sala
          AND  num_bloco   = :NEW.num_bloco
          AND  id_hospital = :NEW.id_hospital;
    END IF;
END;
/
```

---

## 5. Regras de negócio (para a descrição textual, mín. 8)

Já levantadas a partir da especificação do OASIS:
1. Conflito de alocação: sem sobreposição de horário na mesma sala (validado no PHP)
2. Alçada do cirurgião: só cirurgião agenda direto / participa (Trigger 1)
3. Notificação de mudança de status (Trigger 3)
4. Paciente deve estar cadastrado antes da solicitação (garantido por FK)
5. Solicitação segue status Pendente -> Processada/Rejeitada (Trigger 2)
6. Agendamento só existe a partir de uma solicitação (garantido por FK)
7. Cancelar/reagendar só em status válido (Trigger 4)
8. Uma solicitação gera no máximo um agendamento (constraint UNIQUE)
9. Sala liberada ao cancelar cirurgia (Trigger 5)

---

## 6. O que falta fazer

- [ ] Integrar as alterações da seção 2 ao DDL e criar o banco no Oracle
- [ ] Criar os 5 triggers (depois das tabelas)
- [ ] Povoar (mín. 5 registros por tabela; respeitar convenção de strings e horas em minutos)
- [ ] Sistema PHP: CRUD de todas as tabelas + os 5 relatórios SQL
- [ ] Validação de conflito de horário no PHP (antes do INSERT em Agendamento)
- [ ] Gravar vídeo demonstrativo

### Sobre a validação de conflito no PHP
Antes de inserir um Agendamento, rodar um SELECT que checa sobreposição na mesma
sala/bloco/hospital/data. Sobreposição de intervalos = (inicioNovo < fimExistente
AND inicioExistente < fimNovo), onde fim = hora_agendamento + duracao_estimada_minutos
(duração vem de TipoCirurgia via Solicitacao). Se houver conflito, bloquear e avisar.