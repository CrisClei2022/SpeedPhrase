# SpeedPhrase
# 🎮 Etapas de Implementação - Modo Multiplayer com Meta de Tempo

---

## 🎯 Fase 1: Preparação do Ambiente

### ✅ Estrutura de Dados (Appwrite)

Crie uma coleção no Appwrite para armazenar as partidas. Cada documento de partida deve conter os seguintes atributos:

-   `player1Id`: ID do primeiro jogador.
-   `player2Id`: ID do segundo jogador.
-   `player1Time`: Tempo total do jogador 1.
-   `player2Time`: Tempo total do jogador 2.
-   `startTime`: Timestamp de início da partida.
-   `endTime`: Timestamp de fim da partida.
-   `currentTurn`: ID do jogador que tem a vez.
-   `status`: Status da partida (`aguardando`, `em_andamento`, `finalizada`).
-   `phrases`: Um array de objetos, onde cada objeto representa uma frase com a palavra enviada e o ID do jogador que a enviou.

### ✅ Geração de UUID do Jogador

Ao carregar o jogo, verifique se um ID de jogador já existe no `localStorage`. Caso não exista, gere um novo **UUID** e salve-o. Isso garantirá que o jogador seja reconhecido em sessões futuras.

---

## 🎲 Fase 2: Criação e Sincronização da Partida

### 🔄 Lógica do Lobby Multiplayer

1.  Quando o jogador clicar em **multiplayer**, o cliente deve buscar por partidas com o status `aguardando`.
2.  Se encontrar uma partida, o jogador se junta a ela. O cliente envia seu ID de jogador para a partida existente, e o status é atualizado para `em_andamento`.
3.  Se nenhuma partida for encontrada, o cliente cria uma nova partida com seu ID de jogador e o status `aguardando`.
4.  Use o **Appwrite Realtime** para escutar por alterações na coleção de partidas. O cliente que está aguardando (o criador da partida) será notificado quando um segundo jogador se juntar.

### ✅ Início da Partida

A partida inicia quando o status for alterado para `em_andamento`. Ambos os jogadores recebem a notificação em tempo real. Os tempos (`player1Time` e `player2Time`) são inicializados em `0`, e o `startTime` é registrado.

---

## ⚔️ Fase 3: Execução da Partida

### 🕹️ Alternância de Turnos

O cliente que criou a partida é o **host**. Ele será o responsável por definir e alternar o turno. No início, o host define o `currentTurn` para o ID do primeiro jogador.

-   Apenas o jogador com a vez (`currentTurn`) deve ter a interface para selecionar palavras habilitada.
-   Após selecionar a palavra, o jogador envia uma atualização para o documento da partida, incluindo a palavra escolhida e o tempo gasto nessa jogada.
-   O host, ao receber a atualização, recalcula o tempo total do jogador, adiciona a palavra à `phrases` e, em seguida, atualiza o `currentTurn` para o outro jogador.

### ⏳ Atualização da Projeção de Tempo

-   A cada nova palavra enviada, o host recalcula o `tempoAtual` de cada jogador e o tempo total da partida.
-   Com base no `tempoAtual` e no `tempoMeta`, a **performance** é calculada: `(tempoMeta / tempoTotalPartida) * 100`.
-   Essa porcentagem de performance pode ser mostrada em uma barra de progresso ou velocímetro, indicando o desempenho em relação à meta.

### 📦 Sincronização da Frase

-   Quando um jogador envia uma palavra, essa informação é adicionada ao array `phrases` no documento da partida.
-   Graças ao Appwrite Realtime, todos os clientes conectados à partida recebem a atualização instantaneamente.
-   Cada cliente renderiza a frase formada localmente, garantindo que ambos os jogadores vejam o progresso em tempo real, independentemente de quem jogou.

---

## 🏁 Fase 4: Encerramento da Partida

### 📈 Finalização e Resultados

-   Quando o array `phrases` estiver completo (todas as palavras da frase-alvo foram usadas), o host marca a partida como `finalizada` e registra o `endTime`.
-   A interface de ambos os jogadores deve ser atualizada para mostrar os resultados.
-   Apresente o `tempoTotal` de cada jogador, o `tempoMeta` e a `performance %` final.
-   Uma mensagem personalizada pode ser exibida, como "Você venceu!", "Você perdeu!" ou "A meta foi superada!".

---

Se tiver dúvidas em alguma etapa, podemos detalhar mais a lógica.
