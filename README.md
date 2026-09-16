# CRUD de Sessões

Projeto desenvolvido para a disciplina de programação com o objetivo de praticar os conceitos fundamentais de **HTML, CSS, JavaScript, CRUD e armazenamento de dados no navegador**.

A aplicação permite criar, visualizar, editar e excluir sessões, mantendo os dados salvos no `localStorage` do navegador.

## Funcionalidades

* Cadastro de novas sessões
* Visualização das sessões cadastradas
* Edição de sessões existentes
* Exclusão de sessões
* Armazenamento dos dados no `localStorage`
* Persistência dos dados mesmo após atualizar a página

## Informações cadastradas

Cada sessão possui:

* **Nome da sessão**
* **Quantidade de pessoas**
* **Data da sessão**

## Tecnologias utilizadas

* HTML5
* CSS3
* JavaScript
* LocalStorage
* JSON

## Como funciona

O usuário preenche os campos do formulário e clica em **Salvar**.

O JavaScript captura os valores dos inputs utilizando `getElementById()` e `.value`, criando um objeto com os dados da sessão.

Exemplo:

```javascript
let sessao = {
    nome: nomeInput.value,
    quantidade: pessoasInput.value,
    data: dataInput.value
};
```

As sessões são armazenadas em um array e convertidas para JSON utilizando `JSON.stringify()` antes de serem salvas no `localStorage`.

Quando a aplicação é carregada novamente, os dados são recuperados utilizando `getItem()` e convertidos novamente para JavaScript através do `JSON.parse()`.

### Fluxo dos dados

```text
Formulário HTML
      ↓
getElementById() + .value
      ↓
Objeto "sessao"
      ↓
Array "listaSessoes"
      ↓
JSON.stringify()
      ↓
localStorage
      ↓
JSON.parse()
      ↓
Array JavaScript
      ↓
Exibição na página
```

## Estrutura do projeto

```text
CRUD-Sessoes/
│
├── index.html
├── script.js
├── style.css
└── README.md
```

## CRUD

### Create — Criar

Uma nova sessão é adicionada ao array utilizando `push()` e posteriormente salva no `localStorage`.

### Read — Ler

As sessões armazenadas são recuperadas do `localStorage` e exibidas na página através da função `listarSessao()`.

### Update — Atualizar

Ao clicar em **Editar**, os dados da sessão são carregados novamente no formulário. Após a alteração, o objeto antigo é substituído pelo novo.

### Delete — Excluir

Ao clicar em **Deletar**, a função `filter()` cria uma nova lista sem a sessão selecionada e atualiza o `localStorage`.

## Objetivo do projeto

O principal objetivo deste projeto é compreender, na prática, o funcionamento de um CRUD utilizando JavaScript e armazenamento local, desenvolvendo familiaridade com:

* Manipulação do DOM
* Objetos e arrays
* Funções
* Eventos
* `localStorage`
* `JSON.stringify()`
* `JSON.parse()`
* `push()`
* `filter()`
* Estruturas condicionais
* Estruturas de repetição

## Como executar

Não é necessário instalar dependências.

1. Clone este repositório:

```bash
git clone URL_DO_REPOSITORIO
```

2. Abra a pasta do projeto.

3. Abra o arquivo `index.html` no navegador.

4. Utilize o formulário para cadastrar e gerenciar as sessões.

## Projeto acadêmico

Este projeto foi desenvolvido como atividade acadêmica para praticar conceitos de desenvolvimento web e compreender o funcionamento de um CRUD utilizando JavaScript.
