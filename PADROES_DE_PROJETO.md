# Padrões de Projeto no OASIS

Documento que mostra **onde** cada conceito de Engenharia de Software (com foco em
padrões de projeto GoF) é aplicado no sistema e **por quê**. Os padrões foram usados
apenas onde resolvem um problema real do código — não para "encher cota".

## Visão geral

| Padrão | Tipo (GoF) | Onde | Problema que resolve |
|---|---|---|---|
| Singleton | Criacional | [backend/src/db.ts](backend/src/db.ts) | Uma única pool de conexão Oracle para toda a aplicação |
| Factory Method | Criacional | [crudFactory.ts](backend/src/services/crudFactory.ts), [routerFactory.ts](backend/src/routes/routerFactory.ts) | Fabricar serviços/rotas CRUD sem repetir código por tabela |
| Facade | Estrutural | [agendamento.service.ts](backend/src/services/agendamento.service.ts) | Esconder do controller a transação, a validação e o SQL |
| Chain of Responsibility | Comportamental | [validators/agendamento/](backend/src/validators/agendamento/) | Validar o agendamento em etapas independentes e ordenadas |
| State | Comportamental | [domain/status/transicoes.ts](backend/src/domain/status/transicoes.ts) | Permitir só as transições válidas de status |
| Strategy | Comportamental | [reports/](backend/src/reports/) | 5 relatórios intercambiáveis com a mesma interface |
| Provider / Context | Idioma React | [PerfilContext.tsx](frontend/src/context/PerfilContext.tsx) | Compartilhar o perfil/médico logado em toda a UI |
| Observer (polling) | Comportamental | [usePolling.ts](frontend/src/hooks/usePolling.ts) | Manter telas atualizadas sem recarregar a página |

---

## 1. Singleton — pool de conexão

**Intenção:** garantir uma única instância de um recurso caro e um ponto global de acesso.

**Onde:** [backend/src/db.ts](backend/src/db.ts)

A pool do `oracledb` é criada uma única vez em `iniciarPool()` (guarda a variável
`pool` no módulo e retorna cedo se já existir). Todo o backend obtém conexões a partir
dela via `consultar()` e `emTransacao()`. Abrir uma pool por requisição seria proibitivo
— o padrão centraliza a criação e o ciclo de vida (`fecharPool()` no shutdown).

```ts
let pool: oracledb.Pool | null = null;
export async function iniciarPool(): Promise<void> {
  if (pool) return;            // instância única
  pool = await oracledb.createPool(cfg);
}
```

---

## 2. Factory Method — CRUD e rotas genéricos

**Intenção:** delegar a criação de objetos a uma função fábrica, parametrizando o que varia.

**Onde:** [backend/src/services/crudFactory.ts](backend/src/services/crudFactory.ts) e
[backend/src/routes/routerFactory.ts](backend/src/routes/routerFactory.ts)

`criarCrud(cfg)` recebe `{ tabela, pk, colunas, ... }` e devolve um serviço completo
(`listar/buscar/criar/atualizar/remover`) sem escrever SQL à mão para cada tabela.
`criarRouter(svc)` fabrica as rotas REST padrão a partir desse serviço. As tabelas
simples (hospitais, salas, médicos, pacientes...) nascem dessas fábricas — ver
[medico.routes.ts](backend/src/routes/medico.routes.ts).

```ts
const svc = criarCrud({ tabela: 'Medico', pk: 'crm',
  colunas: ['crm','nome','email','especialidade','perfil'] });
export default criarRouter(svc);
```

---

## 3. Facade — serviço de agendamento

**Intenção:** oferecer uma interface simples a um subsistema complexo.

**Onde:** [backend/src/services/agendamento.service.ts](backend/src/services/agendamento.service.ts)

O `criar()` do agendamento esconde do controller três coisas: (a) a **transação**
(`emTransacao`), (b) a **validação em cadeia** (`validarAgendamento`) e (c) o **SQL** de
geração de ID (MAX+1) e INSERT. O controller só chama `criar(dados)`. `crudFactory`
também é uma fachada genérica de CRUD sobre transação + SQL.

```ts
export async function criar(dados: DadosAgendamento) {
  const id = await emTransacao(async (conn) => {
    await validarAgendamento({ conn, dados });   // Chain
    // ... MAX+1 e INSERT
  });
  return buscar(id);
}
```

---

## 4. Chain of Responsibility — validação do agendamento

**Intenção:** passar a requisição por uma cadeia de manipuladores; cada um trata seu
aspecto e delega ao próximo, ou interrompe a cadeia.

**Onde:** [backend/src/validators/agendamento/](backend/src/validators/agendamento/)

A classe base [Handler.ts](backend/src/validators/agendamento/Handler.ts) mantém o
`proximo` e o método `tratar()`. A cadeia é montada em
[index.ts](backend/src/validators/agendamento/index.ts) nesta ordem:

1. `HoraValidaHandler` — hora dentro de 0..1439
2. `SolicitacaoProcessadaHandler` — a solicitação existe e está "Processada" (e injeta a duração no contexto)
3. `ConflitoHorarioHandler` — não há sobreposição de horário na mesma sala

Cada elo valida um aspecto isolado; falhar lança `AppError` e para a cadeia. Adicionar
uma regra nova é só criar um `Handler` e encadeá-lo — sem tocar nos outros.

```ts
const cabeca = new HoraValidaHandler();
cabeca.encadear(new SolicitacaoProcessadaHandler())
      .encadear(new ConflitoHorarioHandler());
```

> O `ConflitoHorarioHandler` compara os intervalos em **minutos absolutos** (data + hora)
> no próprio SQL, porque a cirurgia pode atravessar a meia-noite.

---

## 5. State — transições de status

**Intenção:** restringir o comportamento de um objeto conforme seu estado atual.

**Onde:** [backend/src/domain/status/transicoes.ts](backend/src/domain/status/transicoes.ts)

Duas tabelas de transição declaram quais mudanças são válidas:

- **Solicitação:** `Pendente → Processada | Rejeitada`; `Processada` e `Rejeitada` são terminais.
- **Agendamento:** `Agendado/Reagendado → Reagendado | Cancelado`; `Cancelado` é terminal.

`alterarStatus()` e `reagendar()` chamam `validarTransicao...()` **antes** do UPDATE,
dando um erro amigável (HTTP 409). Os triggers `status_solicitacao` e `status_agendamento`
no banco ([Triggers.sql](Triggers.sql)) espelham essas regras como **rede de segurança** —
garantem a regra mesmo se o UPDATE vier por fora da aplicação.

---

## 6. Strategy — relatórios

**Intenção:** definir uma família de algoritmos intercambiáveis por trás de uma interface comum.

**Onde:** [backend/src/reports/](backend/src/reports/)

A interface [Relatorio.ts](backend/src/reports/Relatorio.ts) define `executar()`. Cada um
dos 5 relatórios em [estrategias.ts](backend/src/reports/estrategias.ts) é uma estratégia
que encapsula uma consulta SQL diferente (e demonstra um recurso de SQL exigido):

| Estratégia | Recurso SQL demonstrado |
|---|---|
| `AgendamentosDetalhados` | Junção interna (INNER JOIN, 5 tabelas) |
| `OcupacaoSalas` | Junção externa (LEFT JOIN) |
| `CirurgiasPorHospital` | Agrupamento (GROUP BY) |
| `TiposMaisSolicitados` | GROUP BY + HAVING |
| `PacientesAcimaDaMedia` | Subconsulta aninhada |

O [index.ts](backend/src/reports/index.ts) registra as estratégias num `Map` por nome e
`executarRelatorio(nome)` seleciona e roda a estratégia certa em tempo de execução — o
cliente não conhece o SQL, só o nome do relatório.

---

## 7. Front-end — Provider/Context e Observer

- **Provider / Context:** [PerfilContext.tsx](frontend/src/context/PerfilContext.tsx)
  disponibiliza `perfil`, `medico` (CRM/nome logado) e `entrar/sair` para toda a árvore de
  componentes via `usePerfil()`, sem *prop drilling*. É o que permite o menu e a página
  "Meus atendimentos" saberem qual médico está logado.
- **Observer (polling):** [usePolling.ts](frontend/src/hooks/usePolling.ts) reexecuta uma
  função em intervalo fixo; telas como **Meus atendimentos**
  ([MeusAtendimentos.tsx](frontend/src/pages/MeusAtendimentos.tsx)) e **Painel de ocupação**
  se "inscrevem" para observar o estado do banco e se atualizam sozinhas (encapsulado para
  trocar por WebSocket depois).
- **Facade (cliente HTTP):** [lib/api.ts](frontend/src/lib/api.ts) concentra baseURL,
  interceptors e as funções `listar/criar/atualizar/remover`, escondendo o Axios das telas.

---

## Onde cada padrão "encosta" no banco

Vários padrões existem **em par** com os triggers, para dar erro amigável na aplicação e,
ao mesmo tempo, garantir a regra no banco:

- **State** (transições) ↔ triggers `status_solicitacao` / `status_agendamento`
- **Chain** (`ConflitoHorarioHandler`) ↔ restrição de unicidade e checagem de sobreposição
- Regra "só cirurgião participa" ↔ trigger `alcada_cirurgiao`

A aplicação valida primeiro (mensagem clara ao usuário); o banco é a rede de segurança final.
