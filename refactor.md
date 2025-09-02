➤ **Gerenciar a Sessão no Lado do Cliente (Solução Robusta)**  
□ Em vez de depender do cookie padrão do Appwrite, podemos gerenciar a sessão explicitamente no código. A ideia é salvar o "segredo" da sessão no `sessionStorage` do navegador, que é exclusivo para cada aba.

⮚ **Plano Detalhado:**  
♦ **Modificar a Sessão:**  
- Ao criar a sessão anônima, em vez de deixar o Appwrite criar um cookie, nós pegamos o objeto da sessão retornado.  
- Salvamos este objeto da sessão no `sessionStorage` da aba.

♦ **Modificar a Função de Inicialização:**  
- Toda vez que a aplicação (uma aba) carregar, ela primeiro verifica se já existe uma sessão salva no `sessionStorage`.  
⯀ Se existir: Usa essa sessão para se autenticar no Appwrite.  
⯀ Se não existir: Cria uma nova sessão anônima e a salva no `sessionStorage`.

❍ Cada aba se comporta como um jogador independente, permitindo testes realistas de multiplayer no mesmo navegador e, mais importante, evitando comportamentos inesperados para os usuários.

➤ **Host - Servidor (Oponente)**


### 1. Estado do Servidor (Novos e Modificados)

🞒 **status**  
   - **Tipo:** String  
   - **Descrição:** (Modificado) Controla o ciclo de vida da partida. Possíveis valores:  
     - *waiting* (aguardando oponente)  
     - *in-game* (partida em andamento)  
     - *finished* (partida encerrada).

🞇 **currentPlayerId**  
   - **Tipo:** String  
   - **Descrição:** (Novo) Define quem tem permissão para jogar. Contém o ID do jogador (hostId ou opponentId) que está com a vez. A UI dos clientes reage a este campo.

🞒 **currentSentenceIndex**  
   - **Tipo:** Integer  
   - **Descrição:** (Novo) Indica o índice da frase atual da lição (ex: 0 para a primeira, 1 para a segunda, etc.). Garante que ambos os jogadores estejam jogando a mesma etapa da lição.

🞇 **currentSentenceWords**  
   - **Tipo:** Array de Strings  
   - **Descrição:** (Novo) Armazena as palavras já formadas da frase atual. Ex: `["I'm", "gonna", "be"]`. Esse formato é mais flexível que uma string única, facilitando a renderização e validação.

🞒 **hostPerformance**  
   - **Tipo:** Float  
   - **Descrição:** (Novo) Acumula a pontuação do host, sendo atualizada a cada jogada do host.

🞇 **opponentPerformance**  
   - **Tipo:** Float  
   - **Descrição:** (Novo) Acumula a pontuação do oponente, sendo atualizada a cada jogada do oponente.

🞒 **winnerId**  
   - **Tipo:** String  
   - **Descrição:** (Modificado) Preenchido no final da partida com o ID do jogador vencedor, baseado na maior pontuação de performance total.

🞇 **lastActivity**  
   - **Tipo:** Datetime  
   - **Descrição:** (Novo/Opcional) Armazena a data e hora da última jogada. Útil para detectar e limpar partidas abandonadas ou "fantasmas".

---

### 2. Estado do Cliente (Local na Aplicação)

➤ **currentGameMode**  
   - **Tipo:** String  
   - **Descrição:** (Existente) Define se o jogo está em modo *solo* ou *multiplayer*. Essencial para direcionar a lógica de jogo.

🞇 **playerRole**  
   - **Tipo:** String  
   - **Descrição:** (Novo) Define o papel do jogador na partida: *host* ou *opponent*. Isso ajuda a determinar qual campo de performance atualizar (hostPerformance ou opponentPerformance).

🞒 **isMyTurn**  
   - **Tipo:** Boolean  
   - **Descrição:** (Novo) Determinado localmente. É `true` se o *currentPlayerId* do servidor for igual ao ID local do jogador. Controla a habilitação ou desabilitação dos botões de jogada.

🞇 **currentLessonData**  
   - **Tipo:** Object  
   - **Descrição:** (Novo) Armazena os dados completos da lição atual (ex: URL do vídeo, legendas parseadas, etc.), evitando a necessidade de buscar esses dados repetidamente.

🞒 **shuffledWords**  
   - **Tipo:** Array de Strings  
   - **Descrição:** (Existente) As palavras da frase atual embaralhadas. Esse estado é local e pode ser reembaralhado a cada nova frase.

🞇 **localPerformanceScore**  
   - **Tipo:** Float  
   - **Descrição:** (Novo) O score de performance calculado localmente para a palavra atual. Após a jogada, será somado ao score total no servidor.

🞒 **isGameLoading**  
   - **Tipo:** Boolean  
   - **Descrição:** (Novo) Indica que o cliente está carregando a lição ou aguardando a primeira sincronização. Útil para mostrar spinners de carregamento e desabilitar a UI.

🞇 **serverState.roomId**  
   - **Tipo:** String  
   - **Descrição:** (Existente) O ID do documento da partida. Essencial para saber qual documento o servidor deve ler e atualizar.

---

### Resumo e Exemplo de Fluxo

⮚ **Início:**  
⯍ *Servidor:* `server.status = 'in-game'`  
⯍ *Servidor:* `server.currentPlayerId = 'host_id_123'`  
⯍ *Cliente do Host:* `playerRole = 'host'`. Ele compara seu ID com `currentPlayerId` e define `isMyTurn = true`. A UI fica ativa.  
⯍ *Cliente do Oponente:* `playerRole = 'opponent'`. Ele compara seu ID e define `isMyTurn = false`. A UI fica inativa.

♦ **Host Joga:**  
⯍ *Cliente do Host:* Calcula `localPerformanceScore = 125.0`.  
⯀ Envia atualização para o servidor:  
  - `currentSentenceWords: ["I'm", "gonna", "be"]`.  
  - `hostPerformance: 125.0`.  
  - `currentPlayerId: 'opponent_id_456'`.  

♦ **Sincronização:**  
⯀ Ambos os clientes recebem a atualização.  
  - *Cliente do Host:* Agora `isMyTurn` se torna `false`. A UI fica inativa.  
  - *Cliente do Oponente:* Agora `isMyTurn` se torna `true`. A UI fica ativa.


⯍ **currentPlayerId:** É a "fonte da verdade" que dita qual dos dois jogadores tem permissão para adicionar a próxima palavra. Isso evita que ambos joguem ao mesmo tempo.

⯍ **currentSentence:** Garante que ambos os jogadores vejam exatamente a mesma frase sendo construída em tempo real.

⯍ **currentSentenceIndex:** Controla qual frase da lição está em jogo.  
**hostPerformance / opponentPerformance:** Agora são do tipo `Float` (ou `Double`) para acumular os scores de performance (ex: 120.5%, 98.2%, etc.).

➤ **Resumo Visual do Fluxo**

□ **Jogador 1 (Host)**  
Clica na Lição -> Cria Documento (status: 'waiting') -> Entra na Tela de Espera -> Escuta o Documento -> Recebe Notificação (status: 'in-game') -> Inicia o Jogo

□ **Jogador 2 (Opponent)**  
Vê Lista de Documentos (status: 'waiting') -> Clica para Entrar -> Atualiza o Documento (status: 'in-game') -> Escuta o Documento -> Inicia o Jogo

➤ **Fluxo de Jogo (Turno a Turno)**

**A. Início da Partida e Primeiro Turno**  
⯀ **Oponente Entra:** O Oponente atualiza o documento da partida, mudando status para in-game.

⯀ **Definição do Primeiro Jogador:** Neste mesmo ato de entrar, o aplicativo do Oponente também define quem começa. Uma regra simples é que o Host sempre começa o primeiro turno.  
⯀ Então, ele define:  
`currentPlayerId: hostId`  
`currentSentence: ""` (frase vazia)  
`currentSentenceIndex: 0` (começa com a primeira frase da lição)  
`hostPerformance: 0.0`  
`opponentPerformance: 0.0`

⯀ **Sincronização:** Ambos os jogadores (Host e Oponente) recebem a notificação de que a partida começou. Eles leem o `currentPlayerId` do documento.

⮚ **App do Host:** Vê que `currentPlayerId` é igual ao seu `user.$id`. A interface dele fica ativa (os botões de palavra são clicáveis).

⮚ **App do Oponente:** Vê que `currentPlayerId` agora é diferente do seu `user.$id`. A interface dele fica inativa/bloqueada (os botões de palavra ficam cinzas, não clicáveis). A UI pode mostrar "Vez do oponente...".

**B. Durante um Turno (Ex: Vez do Host)**  
⯀ **Host Joga:** O Host clica na palavra correta (ex: "I'm").  
⯀ **Cálculo da Performance:** O aplicativo do Host calcula a performance para aquela palavra específica (ex: 115.7%).  
⯀ **Atualização do Servidor:** O aplicativo do Host envia uma única atualização para o documento no Appwrite:  
`currentSentence: "I'm"` (a frase atual + a nova palavra).  
`hostPerformance: 0.0 + 115.7` (seu score anterior + o novo).  
`currentPlayerId: opponentId` (passa o turno para o oponente).

⯀ **Sincronização do Turno Seguinte:** Ambos os jogadores recebem a notificação da atualização.

⯀ **A interface de ambos mostra a frase formada atualizada:** "I'm".

⮚ **App do Host:** Vê que `currentPlayerId` agora é o do oponente. Sua interface fica inativa.  
⮚ **App do Oponente:** Vê que `currentPlayerId` agora é o seu. Sua interface fica ativa. O jogo aguarda a jogada dele.

⯀ O ciclo se repete, com os jogadores trocando de turno a cada palavra adicionada.

**C. Fim de uma Frase**  
⯀ **Última Palavra:** Um jogador adiciona a última palavra da frase.  
⯀ **Atualização Final da Frase:** A atualização enviada para o servidor é um pouco diferente:  
⯀ O jogador atualiza seu performance, a `currentSentence` final, etc.  
⯀ Em vez de passar o turno, o aplicativo pode pausar brevemente, talvez mostrando a frase completa e o vídeo correspondente.  
⯀ Depois da pausa, o jogador que jogou a última palavra inicia a próxima frase, atualizando o documento com:  
`currentSentenceIndex: 1` (avança para a próxima frase).  
`currentSentence: ""` (reseta a frase a ser formada).  
`currentPlayerId: opponentId` (passa o turno para o oponente começar a nova frase).

**D. Fim do Jogo**  
⯀ **Última Frase Completa:** O jogo termina quando a última palavra da última frase da lição é jogada.  
⯀ **Determinar Vencedor:** O jogador que fez a jogada final atualiza o documento uma última vez:  
`status: 'finished'`  
`winnerId: Compara o hostPerformance final com o opponentPerformance final e insere o ID de quem tiver o maior score.`

⯀ **Tela de Resultados:** Ambos os jogadores recebem a notificação de que o status é `finished`. Seus aplicativos leem os scores finais e o `winnerId` e os exibem na tela de resultados.

♦ **Resumo da Lógica**  
A chave de tudo é o campo `currentPlayerId` no banco de dados. Ele funciona como um semáforo, garantindo que apenas um jogador possa agir por vez. Cada jogada atualiza esse campo, passando o controle para o outro jogador e mantendo o jogo perfeitamente sincronizado.



























➤ 
□ 
♦ 
🞇 
🞒
⯀ 
⮚ 
⯍ 

