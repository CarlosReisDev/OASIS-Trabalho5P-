# Contexto de UI — Sistema OASIS (Agendamento Cirúrgico)

Briefing para construir a interface web do OASIS do zero. A UI antiga será
descartada — este documento traz o que aproveitar dela, as correções do
professor e as decisões de design a seguir.

Leia também o `CONTEXTO_PROJETO_OASIS.md` para o lado de banco de dados
(esquema, status, convenções de strings, horas em minutos).

---

## 1. Visão geral do produto

OASIS (Otimização de Agendas e Serviços Integrados de Saúde): sistema web de
agendamento cirúrgico para dois hospitais (João XXIII e Maria Amélia Lins).

Dois módulos:
- **Portal do Médico** — médico solicita cirurgias; cirurgião agenda direto
- **Painel de Gestão** — gestor organiza a pauta e acompanha ocupação em tempo real

Aviso visível nas telas (é protótipo acadêmico): "Dados sintéticos — não use
informações reais de pacientes."

---

## 2. Atores e permissões

| Ator | Pode | Não pode |
|------|------|----------|
| **Médico Clínico / Solicitante** | Criar requisições de cirurgia para seus pacientes | Ver pauta geral, agendar direto |
| **Médico Cirurgião** | Tudo do clínico + agendamento direto de cirurgias da sua alçada | Agendar fora da própria alçada |
| **Gestor Hospitalar** | Ver fila de requisições, agendar, reagendar, cancelar, ver painel de ocupação, cadastros | — |

Observação do professor sobre os papéis: questiona se faz sentido separar
clínico e cirurgião — no fluxo real, o clínico identifica a necessidade e
**encaminha ao especialista (cirurgião), e só o cirurgião marca**. Considerar
esse fluxo ao desenhar; manter os dois perfis mas refletir o encaminhamento.

---

## 3. Telas (com correções do professor)

As telas abaixo vêm da especificação. As anotações marcadas como **[PROF]** são
correções do professor no protótipo antigo e DEVEM ser aplicadas na nova UI.

### T00 — Login
- Seletor de perfil (demo) + senha + botão Entrar
- Aviso de protótipo/dados sintéticos

### T01 — Formulário de Requisição de Cirurgia (CSU01)
Campos: paciente, unidade, tipo de cirurgia, urgência (Eletiva/Urgência/Emergência),
lateralidade, materiais necessários, observações clínicas.
- **[PROF]** Seleção de paciente por listbox/por nome **traz poucos dados** —
  precisa trazer mais dados para **confirmar homônimos** (ex.: data de nascimento,
  CPF parcial). Não basta o nome.
- **[PROF]** O painel "Paciente selecionado" ocupava toda a lateral direita sem
  necessidade — **questionado**. Não desperdiçar a lateral inteira com isso.
- **[PROF]** Campo "Lateralidade" não estava claro ("O que é isso?") — explicar/
  rotular melhor (lateralidade = lado do corpo: esquerdo/direito/não se aplica).

### T02 — Interface de Agendamento Direto (CSU02)
Seleção de paciente, tipo de cirurgia, unidade, sala, dia, horário, com grade de
disponibilidade das salas (slots ocupados destacados em vermelho).
- **[PROF]** Faltava campo de **hora** claro ("Hora?").
- **[PROF]** Refazer o fluxo: **a tela da esquerda faz a seleção do paciente;
  em seguida mostra um cabeçalho com os dados selecionados e libera a tela inteira
  para escolher o horário.** (Em vez de espremer tudo junto.)
- **[PROF]** Precisa de um **botão Confirmar** explícito.
- **[PROF]** O menu lateral deve ficar **oculto ao acessar esta opção** (modo foco
  para a grade de horários).

### T03 — Painel de Gestão: Fila de Requisições (CSU03)
Lista de requisições pendentes, com busca, filtro por urgência e status
(Pendente/Processada/Rejeitada), e painel de detalhes ao selecionar.
- Ações: agendar (chama T02) ou rejeitar (com motivo).
- **[PROF]** Pode haver cirurgias marcadas por urgência, ou seja, outros
  demandantes além da fila normal — a fila não é a única origem de agendamento.

### T04 — Painel de Gestão: Reagendar / Cancelar Cirurgia (CSU04/CSU05)
Edição de sala/data/horário de cirurgia agendada; ou cancelamento com motivo.
Mostra "agendamento atual" x "nova alocação".
- **[PROF]** O ideal seria um **quadro de horários** onde se seleciona uma cirurgia
  (como se fosse para o clipboard) e faz **drag-and-drop** para outro slot.
  Fluxo sugerido: botão direito → menu Selecionar → clica no destino → menu
  Copiar/Colar → botão Salvar. Implementar reagendamento visual por arrastar.

### T05 — Painel de Ocupação em Tempo Real (CSU06)
Dashboard com grade sala x horário, por hospital, atualização automática (~5s).
Cards de resumo (salas no dia, procedimentos, reagendados, % ocupação).
Cores por status: Disponível, Ocupada, Reagendada/Conflito.
- **[PROF]** Adicionar **hints/tooltips** para ver detalhes ao passar/clicar.
- **[PROF]** Usar **gráficos** para melhorar a visualização (além da grade).
- Filtro para alternar entre João XXIII e Maria Amélia Lins (ou consolidado).
- Clique em bloco ocupado abre detalhes (paciente, cirurgião, procedimento).

---

## 4. Padrões visuais e de interação

- **Cores de status** (consistentes em todas as telas):
  Disponível = verde, Ocupada = vermelho, Reagendada/atenção = amarelo.
- **Feedback imediato** em cada ação (confirmações e erros claros — ver lista de
  mensagens abaixo). Usabilidade: mínimo de cliques, agenda visualmente clara.
- **Responsivo** (desktop + tablet/mobile). Web app compatível com navegadores
  principais.
- **Modo foco** na tela de agendamento (menu oculto, ver T02).

### Mensagens do sistema (usar nas confirmações/erros)
- MSG01 Requisição enviada com sucesso.
- MSG02 Cirurgia agendada com sucesso.
- MSG03 Cirurgia cancelada com sucesso.
- MSG04 Cirurgia reagendada com sucesso.
- MSG05 Requisição rejeitada.
- MSG06 Erro: campos obrigatórios não preenchidos.
- MSG07 Erro: conflito de horário detectado (sala já ocupada no período).
- MSG08 Erro: operação não permitida (procedimento fora da sua alçada).
- MSG09 Erro: dados do paciente incompletos. Atualize o cadastro.
- MSG10 Aviso: não há requisições pendentes no momento.
- MSG11 Aviso: dados desatualizados. Falha na sincronização. Reconectando...

---

## 5. Telas de CRUD (exigência do trabalho)

Além das telas de fluxo acima, o trabalho exige **CRUD (inclusão, remoção,
alteração) em TODAS as tabelas**. Telas de cadastro necessárias:
Hospital, Bloco, Sala, Medico, Paciente, TipoCirurgia, Solicitacao,
Agendamento, MedicosParticipantes.

O gestor tem um menu "Cadastros" para isso. Podem ser telas mais simples
(tabela + formulário), não precisam do capricho das telas de fluxo, mas
precisam existir e funcionar para todas as tabelas.

---

## 6. Vínculos importantes com o banco

Ao construir a UI, respeitar o que está no `CONTEXTO_PROJETO_OASIS.md`:

- **Horas são minutos desde a meia-noite** (480 = 08:00). Converter para exibição
  amigável (HH:MM) na tela, mas gravar/consultar como inteiro.
- **Strings de status seguem padrão sem acento, primeira maiúscula**
  ('Pendente', 'Agendado', 'Cancelado', 'Disponivel', 'Cirurgiao' etc.).
  A UI deve enviar exatamente esses valores ao banco (pode exibir com acento,
  mas o valor persistido segue o padrão).
- **Cancelamento é exclusão lógica** (status → 'Cancelado'), nunca DELETE.
- **Validação de conflito de horário acontece no PHP** antes do INSERT em
  Agendamento — a tela de agendamento/reagendamento deve tratar o retorno de
  conflito (MSG07) e impedir a gravação.
- **Alçada do cirurgião** é validada por trigger no banco; a UI deve capturar o
  erro -20002 e exibir MSG08.

---

## 7. Stack sugerida

- PHP (oferecido pelo curso, com driver Oracle OCI8) — mas qualquer ambiente web
  é aceito.
- Front pode ser PHP + HTML/CSS/JS puro, ou com algum framework leve. Manter
  simples o suficiente para demonstrar em vídeo de 5–10 min.
- O painel de ocupação em "tempo real" pode usar polling (refresh a cada ~5s)
  em vez de WebSocket, suficiente para o escopo.

---

## 8. Checklist de UI

- [ ] T00 Login com seleção de perfil
- [ ] T01 Requisição (com correções: homônimos, lateralidade, lateral direita)
- [ ] T02 Agendamento direto (seleção→cabeçalho→tela cheia, botão confirmar, menu oculto, campo hora)
- [ ] T03 Fila de requisições (busca, filtros, rejeitar com motivo)
- [ ] T04 Reagendar/cancelar (idealmente drag-and-drop em quadro de horários)
- [ ] T05 Painel de ocupação (tooltips, gráficos, filtro por hospital, cores)
- [ ] Telas de CRUD para todas as 9 tabelas
- [ ] Tratamento de mensagens MSG01–MSG11
- [ ] Conversão hora-minuto para exibição
- [ ] Responsividade desktop/tablet