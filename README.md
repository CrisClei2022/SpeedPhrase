# SpeedPhrase
---

Para implementar essa estrutura no Appwrite, você vai usar o serviço de **Databases**. O Appwrite simplifica a criação de coleções (que são equivalentes a tabelas de um banco de dados relacional) e a definição dos seus atributos (colunas).

A lógica para as relações, como a de "muitos-para-muitos", é um pouco diferente de um banco de dados tradicional. Em vez de tabelas intermediárias, o Appwrite utiliza atributos de relação que você define diretamente nas coleções.

Vamos ver como ficaria o mapeamento para a estrutura que planejamos:

---

### Mapeando as Coleções no Appwrite

Você precisará de três coleções no total, cada uma funcionando como uma tabela separada em um banco de dados.

#### **1. Coleção `Licoes`**

Esta coleção conterá todas as suas lições, tanto as da "Trilha" quanto as "Avulsas". Ela será o coração do seu banco de dados.

* `name`: **String** (O nome da lição, ex: "Chapter 1 - Welcome & Nationalities")
* `videoUrl`: **URL**
* `srtUrl`: **URL**
* `type`: **String** (Este é o atributo que você usará para diferenciar "trilha" de "avulsas").
* `ordem`: **Integer** (Para manter a sequência das lições da trilha, se houver).

#### **2. Coleção `Categorias`**

Esta coleção armazenará todas as categorias que você usará para agrupar as lições, como "Gramática", "Vocabulário", "Conversação", etc.

* `name`: **String** (O nome da categoria, ex: "Gramática")

#### **3. Coleção `Tags`**

Esta coleção armazenará todas as tags que podem ser usadas para rotular as lições de forma mais granular, como "present simple", "countries", "hobbies".

* `name`: **String** (O nome da tag, ex: "present simple")

---

### Implementando as Relações

Aqui está a parte mais importante. No Appwrite, você vai criar atributos de relacionamento na coleção **`Licoes`** que se conectarão às coleções de **`Categorias`** e **`Tags`**.

#### **Relação com Categorias (Muitos para Muitos)**

* **Na coleção `Licoes`**:
    * Crie um novo atributo.
    * Tipo: **Relationship**
    * Relacionado a: **`Categorias`**
    * Tipo de relação: **Muitos-para-Muitos** (`many-to-many`).
        * _Por quê? Uma lição pode pertencer a várias categorias (ex: "Conversação" e "Gramática"), e uma categoria pode conter várias lições._
    * Chame o atributo de `categorias` ou `lesson_categories`.

#### **Relação com Tags (Muitos para Muitos)**

* **Na coleção `Licoes`**:
    * Crie um novo atributo.
    * Tipo: **Relationship**
    * Relacionado a: **`Tags`**
    * Tipo de relação: **Muitos-para-Muitos** (`many-to-many`).
        * _Por quê? Uma lição pode ter várias tags, e uma tag pode ser usada em várias lições._
    * Chame o atributo de `tags` ou `lesson_tags`.

---

### Como Ficará no Frontend

A sua lógica de frontend irá evoluir para usar o SDK do Appwrite para fazer consultas poderosas.

1.  **Botões `Avulsas` e `Trilha`**:
    * Ao clicar, a função correspondente (`goToAvulsas()` ou `goToTrilha()`) fará uma consulta na coleção **`Licoes`** usando o atributo `type` para filtrar.
    * `appwrite.database.listDocuments('licoes', [Query.equal('type', 'avulsas')])`

2.  **Filtragem por Categorias e Tags**:
    * Quando o usuário quiser ver, por exemplo, todas as lições de "Gramática", você fará uma consulta que busca todas as lições relacionadas àquele ID de categoria.
    * `appwrite.database.listDocuments('licoes', [Query.equal('categorias', 'ID_da_Categoria_Gramatica')])`
    * Isso se aplica da mesma forma para as tags.

Essa abordagem garante que sua base de dados seja limpa e sua aplicação seja flexível. Você pode adicionar novas categorias e tags a qualquer momento pelo painel do Appwrite sem precisar modificar uma única linha de código.

Você tem toda razão. Sua intuição sobre as tags não serem fixas está totalmente correta.

Categorias geralmente são um conjunto limitado e pré-definido (por exemplo: "Gramática", "Vocabulário"), enquanto tags são fluidas e podem ser criadas em tempo real. Pense nas tags de um blog: você pode ter "React", "JavaScript", "frontend", e talvez precise criar uma nova tag como "Tailwind CSS" a qualquer momento.

---

### A Estratégia de Implementação

Para lidar com isso de forma profissional, sua aplicação de nível 1 deve ter uma interface que reflete essa diferença:

* **Para Categorias (fixas):** Exiba uma lista de checkboxes ou um menu `select` com as categorias existentes. O usuário apenas marca as opções que se aplicam à lição.
    * **Backend (Appwrite):** As categorias já estarão cadastradas como documentos na coleção `Categorias`.

* **Para Tags (fluidas):** Exiba um campo de texto onde o usuário pode digitar os nomes das tags, separados por vírgula.
    * **Backend (Appwrite):** Ao processar as tags, sua aplicação de nível 1 vai precisar de uma lógica mais avançada:
        1.  **Iterar sobre as tags digitadas:** Para cada tag digitada (por exemplo, "present simple", "countries").
        2.  **Verificar se a tag já existe:** Faça uma busca na coleção `Tags` para ver se já existe um documento com esse nome.
        3.  **Criar ou Usar o ID:**
            * Se a tag **não existe**, crie um novo documento na coleção `Tags` com o nome digitado.
            * Se a tag **já existe**, use o ID do documento encontrado.
        4.  **Coletar os IDs:** Armazene todos os IDs das tags em uma lista.
        5.  **Criar a Relação:** Ao criar o documento da lição, envie essa lista de IDs para o atributo de relacionamento `tags`.

Essa abordagem garante que as tags sejam dinâmicas e que você não crie tags duplicadas (`gramatica` e `Gramatica`, por exemplo). É uma solução mais robusta e profissional para o seu sistema de gerenciamento de conteúdo.
