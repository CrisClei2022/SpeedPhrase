## Plano de Refatoração em Etapas

Aqui está um plano para aplicar as melhorias de forma segura, minimizando o risco de quebrar a aplicação. Recomendo que você complete uma etapa e teste minuciosamente antes de passar para a próxima.

---

### Etapa 1: Refatorar goToAvulsas e goToTrilha

Esta é a mudança mais simples. Você vai substituir duas funções duplicadas por uma única função parametrizada.

1.  Crie a função `goToLessonCategory(category)`.
2.  Substitua todas as chamadas `goToAvulsas()` e `goToTrilha()` pelas novas chamadas, como `goToLessonCategory('avulsas')` e `goToLessonCategory('trilha')`.
3.  Remova as funções `goToAvulsas` e `goToTrilha` originais.
4.  **Teste:** Verifique se a navegação entre as seções "Avulsas" e "Trilha" ainda funciona corretamente.

---

### Etapa 2: Substituir onclick por addEventListener

Esta etapa melhora a separação da lógica.

1.  Altere a função `createVideoCard` para usar `addEventListener` em vez de `onclick`.
2.  Encontre e altere qualquer outro uso direto de `onclick` no seu código para usar `addEventListener`.
3.  **Teste:** Verifique se o clique nos cards de lição e em qualquer outro elemento com `onclick` ainda funciona.

---

### Etapa 3: Refatorar handleLessonClick

Esta etapa é mais complexa, pois envolve dividir uma função grande em partes menores.

1.  Crie as novas funções `setupExerciseUI(lesson)`, `loadLessonData(lesson)` e `setupExercise(lesson)`.
2.  Mova os blocos de código correspondentes de `handleLessonClick` para as novas funções.
3.  Altere a função `handleLessonClick` para apenas chamar `setupExercise(lesson)`.
4.  **Teste:** Inicie uma lição e verifique se o vídeo, os textos e os timers funcionam perfeitamente. Verifique a navegação para voltar à tela inicial.

```
if (currentGameMode === 'multiplayer') {
    document.getElementById('opponentStatus').classList.remove('hidden');
    updateTurnStatus(false); 
} else {
    document.getElementById('opponentStatus').classList.add('hidden');
    updateTurnStatus(true);
}

//=============================
// Clique no card de lição
//=============================
async function handleLessonClick(lesson) {
    console.log(`Iniciando lição "${lesson.name}" no modo: ${currentGameMode}`);
    if (currentGameMode === 'multiplayer') {
    	// fluxo de funcoes multiplayer    
    } else {
    	// funcao que incia o modo solo    
    }
}

function // nome para funcao mocking modo multiplayer {
}

function // nome para funcao que incia o modo solo (lesson) {
    console.log(`Iniciando lição "${lesson.name}" no modo: ${currentGameMode}`);

    // CORREÇÃO: Limpa o estado do exercício IMEDIATAMENTE ao entrar na lição.
    NavigationController.resetExerciseState();
    NavigationController.updateProgressBadge(); // E atualiza o display
    
    // 1. Prepara a interface para o modo de exercício
    hideAllSections();
    hideFooter();
    
    const main = document.querySelector('main');
    main.style.maxWidth = '800px';
    main.style.margin = '0 auto';
    main.style.paddingTop = '20px';
    
    document.getElementById('videoSection').style.display = '';
    document.getElementById('formedSentenceSection').style.display = '';
    document.getElementById('shuffledWordsSection').style.display = '';

    // 2. Configura o header e a navegação
    NavigationController.sectionConfig.exercise.title = lesson.name;
    NavigationController.navigateTo('exercise');
    NavigationController.showExerciseStatus();

    // 3. Gerencia a visibilidade do status do oponente
    updateExerciseUI(); // Chama a nova função

    // 4. Carrega os recursos da lição
    const video = document.getElementById('video');
    video.src = lesson.videoUrl;
    
    try {
        subtitles = await loadSrt(lesson.srtUrl);
        if (subtitles.length === 0) {
            alert("Erro: Não foi possível carregar as legendas.");
            NavigationController.goHome();
            return;
        }
    } catch (error) {
        console.error("Falha ao carregar ou processar o SRT:", error);
        alert("Ocorreu um erro ao carregar os dados da lição.");
        NavigationController.goHome();
        return;
    }

    totalEstimatedTime = subtitles.reduce((sum, sub) => sum + getTimeLimitForSentence(sub.text), 0);
    totalElapsedTime = 0;
    console.log(`⏱️ Tempo total estimado para a lição: ${totalEstimatedTime.toFixed(2)}s`);
    
    currentIndex = 0;
    
    // 5. **A CORREÇÃO:** Aguarda a preparação da primeira frase antes de concluir.
    await prepareCurrentSubtitle();
}

//=============================
// NOVO: Clique no card de lição
//=============================
async function handleLessonClick(lesson) {
    console.log(`Iniciando lição "${lesson.name}" no modo: ${currentGameMode}`);
    
    if (currentGameMode === 'multiplayer') {
        // Por enquanto, apenas chamamos a função de "mock" para multiplayer
        initMultiplayerGame(lesson);
    } else {
        // Inicia o fluxo completo para o modo solo
        initSoloGame(lesson);
    }
}

//=============================
// Inicia o jogo no modo Solo
//=============================
async function initSoloGame(lesson) {
    console.log(`Iniciando lição "${lesson.name}" no modo Solo`);

    // Limpa o estado do exercício IMEDIATAMENTE ao entrar na lição.
    NavigationController.resetExerciseState();
    NavigationController.updateProgressBadge(); // E atualiza o display
    
    // 1. Prepara a interface para o modo de exercício
    hideAllSections();
    hideFooter();
    
    const main = document.querySelector('main');
    main.style.maxWidth = '800px';
    main.style.margin = '0 auto';
    main.style.paddingTop = '20px';
    
    document.getElementById('videoSection').style.display = '';
    document.getElementById('formedSentenceSection').style.display = '';
    document.getElementById('shuffledWordsSection').style.display = '';

    // 2. Configura o header e a navegação
    NavigationController.sectionConfig.exercise.title = lesson.name;
    NavigationController.navigateTo('exercise');
    NavigationController.showExerciseStatus();

    // 3. Gerencia a visibilidade do status do oponente
    // A função updateExerciseUI() é chamada dentro de NavigationController.navigateTo('exercise')
    // para garantir que a UI seja atualizada com base no modo de jogo.

    // 4. Carrega os recursos da lição
    const video = document.getElementById('video');
    video.src = lesson.videoUrl;
    
    try {
        subtitles = await loadSrt(lesson.srtUrl);
        if (subtitles.length === 0) {
            alert("Erro: Não foi possível carregar as legendas.");
            NavigationController.goHome();
            return;
        }
    } catch (error) {
        console.error("Falha ao carregar ou processar o SRT:", error);
        alert("Ocorreu um erro ao carregar os dados da lição.");
        NavigationController.goHome();
        return;
    }

    totalEstimatedTime = subtitles.reduce((sum, sub) => sum + getTimeLimitForSentence(sub.text), 0);
    totalElapsedTime = 0;
    console.log(`⏱️ Tempo total estimado para a lição: ${totalEstimatedTime.toFixed(2)}s`);
    
    currentIndex = 0;
    
    // 5. Aguarda a preparação da primeira frase antes de concluir.
    await prepareCurrentSubtitle();
}


//================================================
// Função para o modo Multiplayer (mock/esboço)
//================================================
function initMultiplayerGame(lesson) {
    console.log("Iniciando fluxo de criação de partida multiplayer...");
    alert(`Fluxo multiplayer para a lição "${lesson.name}" em desenvolvimento.`);
    
    // Aqui você adicionaria a lógica para criar a sala,
    // conectar os jogadores e sincronizar a lição.
}
```
---

### Etapa 4: Converter para Classes

Esta é a etapa final, que organiza o código em objetos mais formais.

1.  Crie a classe `NavigationController`.
2.  Mova as propriedades e os métodos de `const NavigationController = { ... }` para a nova classe.
3.  Altere todas as chamadas `NavigationController.metodo()` para usar uma nova instância, por exemplo, `appNav.metodo()`, onde `appNav` é `const appNav = new NavigationController();`.
4.  Considere tornar os métodos privados com `#` se desejar.
5.  **Teste:** Teste toda a navegação novamente, incluindo ir para a tela inicial, voltar e selecionar lições.
