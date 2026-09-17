let codigoDaLocacaoEditada = null;

function lidarComSubmitLocacao(event) {
  event.preventDefault();

  let formulario = event.target;
  let locacao = {
    codigo: formulario.codigoLocacao.value,
    quadra: formulario.Quadra.value,
    data: formulario.Data.value
  };

  let locacoes = JSON.parse(localStorage.getItem('locacoes')) || [];

  if (codigoDaLocacaoEditada === null) {
    locacoes.push(locacao);
  } else {
    for (let i = 0; i < locacoes.length; i++) {
      if (locacoes[i].codigo === codigoDaLocacaoEditada) {
        locacoes[i] = locacao;
      }
    }
  }

  localStorage.setItem('locacoes', JSON.stringify(locacoes));

  formulario.reset();
  cancelarEdicaoLocacao();
  listarLocacoes();
}

function listarLocacoes() {
  let lista = document.getElementById('lista-locacoes');
  let locacoes = JSON.parse(localStorage.getItem('locacoes')) || [];

  lista.innerHTML = '';

  for (let i = 0; i < locacoes.length; i++) {
    let locacao = locacoes[i];
    let item = document.createElement('li');

    item.textContent = 'Quadra: ' + locacao.quadra + ' - Data: ' + locacao.data + ' - Código: ' + locacao.codigo;

    let botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar';
    botaoEditar.type = 'button';
    botaoEditar.onclick = function() {
      editarLocacao(locacao);
    };

    let botaoDeletar = document.createElement('button');
    botaoDeletar.textContent = 'Deletar';
    botaoDeletar.type = 'button';
    botaoDeletar.onclick = function() {
      deletarLocacao(locacao.codigo);
    };

    item.appendChild(document.createTextNode(' '));
    item.appendChild(botaoEditar);
    item.appendChild(document.createTextNode(' '));
    item.appendChild(botaoDeletar);
    lista.appendChild(item);
  }
}

function editarLocacao(locacao) {
  let formulario = document.getElementById('form-locacao');

  formulario.codigoLocacao.value = locacao.codigo;
  formulario.Quadra.value = locacao.quadra;
  formulario.Data.value = locacao.data;

  codigoDaLocacaoEditada = locacao.codigo;
  document.getElementById('botao-submit-locacao').textContent = 'Salvar';
  document.getElementById('botao-cancelar-locacao').hidden = false;
}

function cancelarEdicaoLocacao() {
  codigoDaLocacaoEditada = null;
  document.getElementById('botao-submit-locacao').textContent = 'Enviar';
  document.getElementById('botao-cancelar-locacao').hidden = true;
}

function deletarLocacao(codigo) {
  let locacoes = JSON.parse(localStorage.getItem('locacoes')) || [];
  let novasLocacoes = [];

  for (let i = 0; i < locacoes.length; i++) {
    if (locacoes[i].codigo !== codigo) {
      novasLocacoes.push(locacoes[i]);
    }
  }

  localStorage.setItem('locacoes', JSON.stringify(novasLocacoes));
  listarLocacoes();
}

document.getElementById('botao-cancelar-locacao').onclick = function() {
  document.getElementById('form-locacao').reset();
  cancelarEdicaoLocacao();
};

listarLocacoes();
