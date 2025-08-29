# SpeedPhrase
---
  
Para implementar essa estrutura no Appwrite, você vai usar o serviço de **Databases**. O Appwrite simplifica a criação de coleções (que são equivalentes a tabelas de um banco de dados relacional) e a definição dos seus atributos (colunas).

A lógica para as relações, como a de "muitos-para-muitos", é um pouco diferente de um banco de dados tradicional. Em vez de tabelas intermediárias, o Appwrite utiliza atributos de relação que você define diretamente nas coleções.

Vamos ver como ficaria o mapeamento para a estrutura que planejamos:

---

### Mapeando as Coleções no Appwrite

Você precisará criar as seguintes **Coleções** e definir seus **Atributos**:

#### **1. Coleção `Licoes`**

Esta é a coleção principal para o conteúdo.

* `nome_licao`: String
* `descricao`: String
* `link_video`: URL
* `quantidade_frases`: Integer
* `link_srt`: URL (Você pode adicionar isso para armazenar o link da legenda)

#### **2. Coleção `Trilhas`**

Esta coleção agrupa as trilhas de estudo.

* `nome_trilha`: String
* `descricao_trilha`: String

---

### Implementando as Relações

Aqui está a parte mais importante para simular o modelo relacional no Appwrite. Você vai usar o recurso de **Atributos de Relação**.

#### **Relação `Licoes` <> `Trilhas`**

Em vez de uma tabela `trilhas_licoes`, você vai criar um atributo de relação nas duas coleções:

* **Na coleção `Licoes`**: Crie um atributo chamado `trilha`.
    * Tipo: **Relationship**
    * Relacionado a: **`Trilhas`**
    * Tipo de relação: **Um-para-Muitos** (`one-to-many`) ou **Muitos-para-Um** (`many-to-one`). Como uma lição pode pertencer a apenas uma trilha, o ideal é **Muitos-para-Um**.

* **Na coleção `Trilhas`**: Crie um atributo chamado `licoes_da_trilha`.
    * Tipo: **Relationship**
    * Relacionado a: **`Licoes`**
    * Tipo de relação: **Um-para-Muitos** (`one-to-many`). Esta relação será a "outra ponta" da relação anterior, permitindo que uma trilha contenha várias lições.

#### **Como lidar com a ordem (`ordem`)**

O Appwrite não tem um atributo `ordem` para relações nativamente. A forma mais comum de lidar com isso é **adicionar um atributo de ordem diretamente na coleção de `Licoes`**.

* **Na coleção `Licoes`**: Adicione um atributo `ordem_na_trilha` (Tipo: `Integer`).

Ao exibir uma trilha, você pode buscar todas as lições associadas a ela e, em seguida, **ordená-las** pelo atributo `ordem_na_trilha` na sua aplicação.

---

### Implementando Categorias e Tags

Você pode usar a mesma lógica de relação para categorias e tags.

#### **Coleção `Categorias`**

* `nome_categoria`: String

#### **Coleção `Tags`**

* `nome_tag`: String

#### **Relações Muitos-para-Muitos**

* **Na coleção `Licoes`**:
    * Crie um atributo `categorias`.
        * Tipo: **Relationship**
        * Relacionado a: **`Categorias`**
        * Tipo de relação: **Muitos-para-Muitos** (`many-to-many`). Uma lição pode ter várias categorias.

    * Crie um atributo `tags`.
        * Tipo: **Relationship**
        * Relacionado a: **`Tags`**
        * Tipo de relação: **Muitos-para-Muitos** (`many-to-many`). Uma lição pode ter várias tags.

### Resumo do Fluxo no Appwrite

1.  **Crie as coleções**: `Licoes`, `Trilhas`, `Categorias`, `Tags`.
2.  **Defina os atributos simples**: Nome, descrição, links, etc.
3.  **Crie os atributos de relacionamento**:
    * **Trilhas/Lições**: Uma relação **Muitos-para-Um** (`many-to-one`) de `Licoes` para `Trilhas`.
    * **Categorias/Lições**: Uma relação **Muitos-para-Muitos** (`many-to-many`) de `Licoes` para `Categorias`.
    * **Tags/Lições**: Uma relação **Muitos-para-Muitos** (`many-to-many`) de `Licoes` para `Tags`.

Essa abordagem, além de ser mais nativa ao Appwrite, também simplifica a lógica de consulta. Ao buscar uma lição, você já pode incluir as informações de suas categorias e tags relacionadas em uma única requisição.

A documentação do Appwrite é excelente para te guiar, principalmente na seção de **Databases > Attributes > Relationship Attributes**.
