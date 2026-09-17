let codigoDoProdutoEditado = null;

function lidarComSubmit(event) {
  event.preventDefault();

  let formulario = event.target;
  let produto = {
    nome: formulario.nome.value,
    preco: formulario.preco.value,
    codigo: formulario.codigo.value
  };

  let produtos = JSON.parse(localStorage.getItem('produtos')) ?? [];


  if (codigoDoProdutoEditado === null) {
    produtos.push(produto);
  } else {
    for (let i = 0; i < produtos.length; i++) {
      if (produtos[i].codigo === codigoDoProdutoEditado) {
        produtos[i] = produto;
      }
    }
  }

  localStorage.setItem('produtos', JSON.stringify(produtos));

  formulario.reset();
  cancelarEdicao();
  listarProdutos();
}

function listarProdutos() {
  let lista = document.getElementById('lista-produtos');
  let produtos = JSON.parse(localStorage.getItem('produtos'));


  lista.innerHTML = '';

  for (let i = 0; i < produtos.length; i++) {
    let produto = produtos[i];
    let item = document.createElement('li');

    item.textContent = produto.nome + ' - R$ ' + produto.preco + ' - Código: ' + produto.codigo;

    let botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar';
    botaoEditar.type = 'button';
    botaoEditar.onclick = function() {
      editarProduto(produto);
    };

    let botaoDeletar = document.createElement('button');
    botaoDeletar.textContent = 'Deletar';
    botaoDeletar.type = 'button';
    botaoDeletar.onclick = function() {
      deletarProduto(produto.codigo);
    };

    item.appendChild(document.createTextNode(' '));
    item.appendChild(botaoEditar);
    item.appendChild(document.createTextNode(' '));
    item.appendChild(botaoDeletar);
    lista.appendChild(item);
  }
}

function editarProduto(produto) {
  let formulario = document.getElementById('form-produto');

  formulario.nome.value = produto.nome;
  formulario.preco.value = produto.preco;
  formulario.codigo.value = produto.codigo;

  codigoDoProdutoEditado = produto.codigo;
  document.getElementById('botao-submit').textContent = 'Salvar';
  document.getElementById('botao-cancelar').hidden = false;
}

function cancelarEdicao() {
  codigoDoProdutoEditado = null;
  document.getElementById('botao-submit').textContent = 'Enviar';
  document.getElementById('botao-cancelar').hidden = true;
}

function deletarProduto(codigo) {
  let produtos = JSON.parse(localStorage.getItem('produtos'));
  let novosProdutos = [];

  if (produtos === null) {
    produtos = [];
  }

  for (let i = 0; i < produtos.length; i++) {
    if (produtos[i].codigo !== codigo) {
      novosProdutos.push(produtos[i]);
    }
  }

  localStorage.setItem('produtos', JSON.stringify(novosProdutos));
  listarProdutos();
}

document.getElementById('botao-cancelar').onclick = function() {
  document.getElementById('form-produto').reset();
  cancelarEdicao();
};

listarProdutos();
