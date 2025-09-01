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
//==================================================
// Roteador principal para o clique no card de lição
//==================================================
async function handleLessonClick(lesson) {
    console.log(`Iniciando lição "${lesson.name}" no modo: ${currentGameMode}`);
    
    if (currentGameMode === 'multiplayer') {
        initMultiplayerGame(lesson);
    } else {
        initSoloGame(lesson);
    }
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
