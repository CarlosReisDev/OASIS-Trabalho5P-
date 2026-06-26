# Base de Conhecimento: Padrões de Projeto (Design Patterns - GoF)

Este documento descreve 23 padrões de projeto abstratos. Eles estabelecem um vocabulário comum de projeto, promovem a reutilização de código e ajudam a projetar sistemas independentemente da linguagem final de implementação. Os padrões são divididos em três categorias principais: Criacionais, Estruturais e Comportamentais.

---

## 1. Padrões Criacionais
Descrevem técnicas para instanciar objetos ou grupos de objetos, ocultando a lógica de criação do cliente.

### 1.1 Singleton
* **Contexto e Domínio:** Situações onde é estritamente necessário que exista apenas uma única instância de uma classe rodando no sistema, e que ela seja acessível globalmente.
* **Mapeamento de Padrões:** O padrão garante que uma classe tenha no máximo um objeto instanciado. Deve permitir a extensão via subclasses sem alterar o código cliente.
* **Regras de Geração:**
    * A IA deve declarar o construtor da classe como privado para impedir instanciação externa.
    * A IA deve manter uma referência estática privada para o único objeto instanciado.
    * A IA deve expor um método estático público (ex: `getInstance()`) que retorne a referência do objeto.

### 1.2 Factory Method
* **Contexto e Domínio:** O cliente precisa criar objetos, mas não deve saber (ou não importa) qual classe concreta será instanciada.
* **Mapeamento de Padrões:** Define uma interface para criar um objeto, mas delega a decisão de qual classe instanciar para as subclasses (construtor virtual).
* **Regras de Geração:**
    * A IA deve definir uma classe `Creator` (abstrata ou concreta) contendo a assinatura do método fábrica.
    * A IA deve implementar subclasses de `Creator` que sobrescrevam o método fábrica para retornar um `ConcreteProduct`.
    * A IA pode, se necessário, parametrizar o método fábrica para decidir dinamicamente o tipo a ser criado.

### 1.3 Abstract Factory
* **Contexto e Domínio:** Criação de "famílias" de objetos relacionados ou dependentes (ex: componentes de UI para diferentes sistemas operacionais) sem expor as classes concretas ao cliente.
* **Mapeamento de Padrões:** Consiste na implementação de múltiplos *Factory Methods* organizados em uma interface central.
* **Regras de Geração:**
    * A IA deve declarar uma interface `AbstractFactory` contendo métodos para criar diferentes tipos de objetos-produto abstratos.
    * A IA deve criar classes `ConcreteFactory` que implementam a `AbstractFactory` para instanciar famílias de produtos específicos.
    * A IA não deve acoplar o código cliente às classes concretas; o cliente deve interagir apenas com as interfaces abstratas.

### 1.4 Prototype
* **Contexto e Domínio:** O sistema precisa criar cópias de objetos complexos cuja classe exata só é conhecida em tempo de execução, evitando o custo de instanciar e inicializar do zero.
* **Mapeamento de Padrões:** Especifica os tipos de objetos a serem criados usando uma instância protótipo e cria novos objetos por meio da cópia desse protótipo.
* **Regras de Geração:**
    * A IA deve declarar uma interface ou classe abstrata `Prototype` contendo o método de clonagem.
    * A IA deve implementar o construtor por cópia nas classes concretas, garantindo que os novos objetos recebam os mesmos valores dos atributos do original.

---

## 2. Padrões Estruturais
Permitem que os projetistas organizem classes e objetos em estruturas maiores e mais complexas.

### 2.1 Proxy
* **Contexto e Domínio:** Necessidade de controlar o acesso, adicionar segurança, ou adiar a inicialização (lazy initialization) de um objeto pesado ou sensível.
* **Mapeamento de Padrões:** Fornece um objeto substituto (marcador) que age em nome do objeto real para interceptar e controlar o acesso a ele.
* **Regras de Geração:**
    * A IA deve definir uma interface comum (Subject) implementada tanto pelo Proxy quanto pelo objeto Real.
    * A IA deve garantir que o Proxy mantenha uma referência interna ao objeto Real.
    * A IA deve fazer com que o Proxy intercepte a chamada, execute a lógica adicional (permissão, cache, etc.) e, se aplicável, delegue a execução ao objeto Real.

### 2.2 Adapter
* **Contexto e Domínio:** Necessidade de integrar sistemas legados ou bibliotecas de terceiros cujas interfaces são incompatíveis com o sistema atual.
* **Mapeamento de Padrões:** Converte a interface de uma classe em outra interface que o cliente espera encontrar, permitindo que trabalhem em conjunto.
* **Regras de Geração:**
    * A IA deve identificar a interface esperada pelo cliente (`Target`) e a classe incompatível (`Adaptee`).
    * A IA deve gerar a classe `Adapter` implementando a interface `Target` e compondo internamente (ou herdando) o `Adaptee`.
    * A IA deve mapear e converter parâmetros e retornos dentro dos métodos do `Adapter`.

### 2.3 Bridge
* **Contexto e Domínio:** Sistemas que precisam rodar em múltiplas plataformas ou possuir múltiplas implementações de uma mesma abstração geométrica/visual, devendo escalar de forma independente.
* **Mapeamento de Padrões:** Desacopla uma abstração de sua implementação para que as duas possam variar e ser estendidas independentemente.
* **Regras de Geração:**
    * A IA deve separar a hierarquia em duas: uma para Abstração e outra para Implementação (`Implementor`).
    * A IA deve usar composição: a Abstração deve manter uma referência para um objeto do tipo `Implementor`.
    * A IA deve delegar as operações específicas de plataforma da Abstração para o objeto `Implementor`.

### 2.4 Composite
* **Contexto e Domínio:** Representação de hierarquias do tipo "parte-todo", como árvores de diretórios/arquivos ou hierarquias corporativas.
* **Mapeamento de Padrões:** Compõe objetos em estruturas de árvore, permitindo que clientes tratem objetos individuais e composições de objetos de maneira perfeitamente uniforme.
* **Regras de Geração:**
    * A IA deve criar uma interface ou classe abstrata comum (`Component`) para nós folhas e nós compostos.
    * A IA deve criar a classe `Composite` contendo uma lista de objetos do tipo `Component`.
    * A IA deve garantir que os métodos no `Composite` iterem sobre seus filhos delegando a chamada da operação a eles.

### 2.5 Decorator
* **Contexto e Domínio:** Necessidade de adicionar funcionalidades ou comportamentos a um objeto dinamicamente em tempo de execução, como uma alternativa flexível à herança excessiva.
* **Mapeamento de Padrões:** Agrega responsabilidades adicionais envolvendo o objeto original dentro de outro objeto (o decorador) que compartilha da mesma interface.
* **Regras de Geração:**
    * A IA deve criar uma classe `Decorator` que implementa a mesma interface do objeto `Component` base.
    * A IA deve injetar via construtor a referência do `Component` base dentro do `Decorator`.
    * A IA deve delegar a execução ao componente interno e concatenar o novo comportamento (antes ou depois da delegação).

### 2.6 Facade
* **Contexto e Domínio:** Interação com subsistemas extremamente complexos, compostos por várias classes e configurações (ex: APIs de renderização ou motores de áudio).
* **Mapeamento de Padrões:** Fornece uma interface unificada e de alto nível para um conjunto de interfaces do subsistema, tornando-o mais fácil de ser consumido pelo cliente.
* **Regras de Geração:**
    * A IA deve construir uma classe `Facade` que detém a responsabilidade de instanciar, inicializar e orquestrar as classes do subsistema.
    * A IA deve expor no `Facade` apenas os métodos essenciais e simplificados requeridos pelo cliente.
    * A IA não deve adicionar lógicas de domínio complexas no `Facade`; ele atua apenas como um orquestrador/delegador.

---

## 3. Padrões Comportamentais
Tratam da distribuição de responsabilidades e da comunicação eficiente entre objetos e classes.

### 3.1 Memento
* **Contexto e Domínio:** Sistemas que requerem recursos como "desfazer", "histórico" ou "check points", como editores de texto ou vídeo.
* **Mapeamento de Padrões:** Captura e externaliza o estado interno de um objeto sem violar o encapsulamento, para restauração futura.
* **Regras de Geração:**
    * A IA deve separar a arquitetura em três partes: `Originator` (dono do estado), `Memento` (objeto imutável que guarda o estado) e `CareTaker` (gerenciador do histórico).
    * A IA deve garantir que apenas o `Originator` tenha permissão para criar Mementos ou ler seus dados para restauração.
    * A IA deve programar o `CareTaker` para apenas armazenar a lista de Mementos, sem examinar seus conteúdos internos.

### 3.2 State
* **Contexto e Domínio:** Objetos que mudam drasticamente seu comportamento com base em seu ciclo de vida ou status atual, evitando cadeias complexas de `if/switch`.
* **Mapeamento de Padrões:** Permite que um objeto altere seu comportamento delegando a execução para classes que representam o seu estado interno. O objeto parecerá ter mudado de classe.
* **Regras de Geração:**
    * A IA deve extrair cada estado possível para uma classe concreta separada (`ConcreteState`) que implementa uma interface comum (`State`).
    * A IA deve manter no `Context` uma referência de instância de `State` apontando para o estado corrente.
    * A IA deve fazer com que cada estado concreto decida como lidar com a requisição e quem será o próximo estado a ser retornado para o `Context`.

### 3.3 Chain of Responsibility
* **Contexto e Domínio:** Sistemas de aprovação, filtros ou cadeias de validação (ex: pagamentos múltiplos), eliminando estruturas condicionais acopladas para escolha do recebedor.
* **Mapeamento de Padrões:** Encadeia objetos receptores, passando a requisição ao longo da cadeia até que um deles assuma a responsabilidade de tratá-la.
* **Regras de Geração:**
    * A IA deve criar uma interface/classe base genérica `Handler` contendo uma referência genérica para o próximo elo (`next`).
    * A IA deve programar o cliente para inicializar a cadeia configurando o sucessor de cada objeto (ex: `setNext()`).
    * A IA deve implementar em cada nó concreto a lógica: se for capaz de tratar a requisição, trata; caso contrário, chama recursivamente a requisição no objeto `next`.

### 3.4 Command
* **Contexto e Domínio:** Transformar ações, transações ou chamadas de execução em objetos literais, facilitando filas, logs e operações de *undo*.
* **Mapeamento de Padrões:** Encapsula uma requisição como um objeto completo, permitindo parametrizar o cliente com diferentes requisições.
* **Regras de Geração:**
    * A IA deve declarar a interface `Command` estipulando um método unificado (geralmente `execute()`).
    * A IA deve criar classes concretas de comando que vinculam o objeto receptor (`Receiver`) à ação que deve ser disparada.
    * A IA deve permitir que o invocador chame `execute()` cegamente através da interface abstrata.

### 3.5 Observer
* **Contexto e Domínio:** Aplicações com várias representações visuais ou reações em cadeia que devem ocorrer automaticamente após a alteração de um dado base (modelo *Publisher/Subscriber*).
* **Mapeamento de Padrões:** Define uma dependência um para muitos: quando um objeto (`Subject`) altera o estado, todos os dependentes (`Observers`) são notificados e atualizados.
* **Regras de Geração:**
    * A IA deve criar o `Subject` contendo uma lista estruturada de `Observers` e métodos para registro/remoção (`attach/detach`).
    * A IA deve disparar um método `notify()` iterando sobre a lista de `Observers` invocando `update()` sempre que o estado interno do `Subject` for mutado via `setState`.
    * A IA deve garantir que os `Observers` consultem o estado do `Subject` durante sua própria atualização para obter as alterações.

### 3.6 Strategy
* **Contexto e Domínio:** Regras de negócio suscetíveis a mudanças constantes ou variações (cálculos de impostos, algoritmos de frete, estratégias de roteamento).
* **Mapeamento de Padrões:** Define, encapsula e isola uma família de algoritmos, tornando-os intercambiáveis em tempo de execução independentemente do cliente.
* **Regras de Geração:**
    * A IA deve abstrair a regra que varia criando uma interface genérica `Strategy`.
    * A IA deve encapsular os diferentes algoritmos (`ConcreteStrategy`) de forma individual.
    * A IA deve configurar a classe `Context` para possuir um atributo do tipo da interface `Strategy` e executar os cálculos de negócio através dessa injeção.

### 3.7 Template Method
* **Contexto e Domínio:** Fluxos de execução padrão onde o passo a passo geral não muda, mas os detalhes exatos de alguns passos variam (ex: algoritmos de ordenação, parsers).
* **Mapeamento de Padrões:** Define o esqueleto arquitetural de um algoritmo em uma classe base, delegando a implementação de passos granulares para subclasses.
* **Regras de Geração:**
    * A IA deve construir uma superclasse abstrata que declare o método principal da rotina (o *Template Method*) contendo o loop lógico rígido.
    * A IA deve declarar métodos auxiliares e abstratos (operações primitivas) que serão implementados pelas subclasses para preencher as partes flexíveis da lógica.

### 3.8 Iterator
* **Contexto e Domínio:** Coleções ou agregados de dados heterogêneos (Arrays, Listas, Árvores) onde o cliente não deve precisar saber se está lidando com índices estáticos ou ponteiros.
* **Mapeamento de Padrões:** Fornece um modo seguro para percorrer sequencialmente elementos de um agregado sem expor sua camada de dados interna.
* **Regras de Geração:**
    * A IA deve criar uma interface para varredura garantindo métodos padronizados (ex: `first()`, `next()`, `isDone()`, `currentItem()`).
    * A IA deve separar a lógica de iteração da classe da coleção, delegando-a para a classe `Iterator` apropriada (ex: um para Arrays, outro para Lists).
    * A IA deve fazer com que o cliente receba o iterador da coleção e utilize apenas a interface iteradora para realizar laços.