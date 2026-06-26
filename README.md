# OASIS — Sistema de Agendamento Cirúrgico

Trabalho prático de Banco de Dados I / LBD I (CEFET-MG). Sistema web de agendamento
cirúrgico para dois hospitais (João XXIII e Maria Amélia Lins), com banco Oracle,
backend REST e front em React.

```
React (UI)  →  HTTP/JSON  →  Backend (Node/Express)  →  Oracle (Autonomous DB)
```

---

## 1. Estrutura do projeto

```
TrabalhoFinal/
  Banco.sql          DDL: cria as tabelas (+ CHECK de hora)
  Triggers.sql       Os 5 triggers (alçada, status, notificação, libera sala)
  Povoamento.sql     Dados de exemplo (mín. 5 por tabela)
  backend/           API REST (TypeScript + Express + oracledb)
    wallet/          Wallet do Oracle (NÃO versionar)
    instantclient_*  Oracle Instant Client (NÃO versionar)
    setup.ts         Runner que executa os 3 .sql no banco
    .env             Credenciais e caminhos (NÃO versionar)
  frontend/          Interface (React + Vite + Tailwind + shadcn/ui)
    .env             VITE_API_URL
```

---

## 2. Pré-requisitos

- **Node.js 18+** e npm.
- **Wallet do Oracle Autonomous DB** descompactado em `backend/wallet/`
  (contém `tnsnames.ora`, `sqlnet.ora`, `cwallet.sso`).
- **Oracle Instant Client** em `backend/instantclient_23_26/` (já incluído nesta máquina).
  Necessário para o modo Thick, que usa o `cwallet.sso` (login sem senha de wallet,
  igual ao SQL Developer).

> No Linux, o Instant Client precisa da `libaio`. Se faltar, há um symlink em
> `backend/instantclient_23_26/libaio.so.1`. Em distros novas (Ubuntu/Pop), ele aponta
> para `libaio.so.1t64`.

---

## 3. Configuração (`backend/.env`)

```env
ORA_USER=ECLBDIT101
ORA_PASSWORD=sua_senha_do_banco
ORA_CONNECT_STRING=ecbdt_high          # alias do tnsnames.ora (use _high ou _low)

# Wallet + Instant Client (caminhos ABSOLUTOS desta máquina)
ORA_WALLET_DIR=/caminho/.../backend/wallet
ORA_CLIENT_LIB_DIR=/caminho/.../backend/instantclient_23_26
ORA_WALLET_PASSWORD=                    # vazio no modo Thick

PORT=3001
```

E em `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

> Se mover o projeto de pasta, atualize `ORA_WALLET_DIR` e `ORA_CLIENT_LIB_DIR`
> (são caminhos absolutos) e o caminho dentro de `backend/wallet/sqlnet.ora`.

---

## 4. Como rodar

### Passo 1 — criar o banco (uma vez)
```bash
cd backend
npm install
npm run db:setup     # executa Banco.sql → Triggers.sql → Povoamento.sql
```
`db:setup` é idempotente: dropa o que existe e recria. Ao final, mostra "Setup concluido".

### Passo 2 — subir o backend
```bash
cd backend
npm run dev          # http://localhost:3001
```
Teste rápido: `curl http://localhost:3001/api/hospitais` deve retornar 5 hospitais.

### Passo 3 — subir o frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```
Abra o navegador, faça login escolhendo um **perfil** (Gestor vê tudo).

---

## 5. O que demonstrar (checklist do trabalho)

- **CRUD de todas as tabelas**: menu *Cadastros* (perfil Gestor).
- **Fluxos**: Requisição (T01) → Fila/Processar (T03) → Agendamento direto (T02) →
  Reagendar/Cancelar (T04) → Painel de Ocupação em tempo real (T05).
- **5 triggers** (no banco):
  1. alçada do cirurgião (só cirurgião participa)
  2. transição de status da solicitação
  3. notificação automática ao agendar/reagendar/cancelar
  4. transição de status do agendamento
  5. libera a sala ao cancelar
- **5 relatórios SQL** (página *Relatórios*): junção interna, junção externa,
  GROUP BY, HAVING e subconsulta aninhada.
- **Validação de conflito de horário**: no backend, antes de inserir o agendamento
  (mensagem MSG07 na UI).

---

## 6. Convenções importantes

- **Horas = minutos desde a meia-noite** (480 = 08:00). A UI exibe HH:MM e grava inteiro.
- **Status sem acento, primeira maiúscula** ('Agendado', 'Cancelado', 'Disponivel'...).
- **Cancelamento é lógico** (status → 'Cancelado'), nunca DELETE físico.

---

## 7. Problemas comuns

| Sintoma | Causa / Solução |
|---|---|
| `ORA-00942: table or view does not exist` | Tabelas não criadas neste schema. Rode `npm run db:setup`. |
| `DPI-1047 ... libnnz.so` | Instant Client não encontrado. Confirme `ORA_CLIENT_LIB_DIR` e o `LD_LIBRARY_PATH` (já embutido nos scripts npm). |
| `DPI-1047 ... libaio` | Falta `libaio.so.1`. Recrie o symlink em `instantclient_23_26/`. |
| API responde mas dá erro ao salvar agendamento | Pode ser conflito de horário (MSG07) ou solicitação não 'Processada'. |
| Front sem dados | Backend no ar? `VITE_API_URL` correto? Veja o console do navegador. |

---

## 8. Endpoints principais (backend)

`GET/POST/PUT/DELETE /api/{hospitais, blocos, salas, medicos, pacientes,
tipos-cirurgia, solicitacoes, agendamentos, medicos-participantes}`
· `GET /api/notificacoes` (somente leitura) · `GET /api/relatorios/:nome` · `GET /api/health`
