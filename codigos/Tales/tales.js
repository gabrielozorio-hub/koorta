
let codigoDoEsporteEditado = null;

function lidarComSubmit(event) {
  event.preventDefault();

  let formulario = event.target;

  let esporte = {
    nome: formulario.nome.value,
    modalidade: formulario.modalidade.value,
    codigo: formulario.codigo.value
  };

  let esportes = JSON.parse(localStorage.getItem('esportes')) ?? [];



  modalidade
  if (codigoDoEsporteEditado === null) {
    esportes.push(esporte);
  } else {
    modalidade
    for (let i = 0; i < esportes.length; i++) {
      if (esportes[i].codigo === codigoDoEsporteEditado) {
        esportes[i] = esporte;
      }
    }
  }

  localStorage.setItem('esportes', JSON.stringify(esportes));

  formulario.reset();
  cancelarEdicao();
  listarEsportes();
}

function listarEsportes() {
  let lista = document.getElementById('lista-esportes');
  let esportes = JSON.parse(localStorage.getItem('esportes'));

  if (esportes === null) {
    esportes = [];
  }

  lista.innerHTML = '';

  for (let i = 0; i < esportes.length; i++) {
    let esporte = esportes[i];

    let item = document.createElement('li');

    item.textContent =
      esporte.nome +
      ' - ' +
      esporte.modalidade +
      ' - Código: ' +
      esporte.codigo;

    modalidade
    let botaoEditar = document.createElement('button');

    botaoEditar.textContent = 'Editar';
    botaoEditar.type = 'button';

    botaoEditar.onclick = function () {
      editarEsporte(esporte);
    };

    modalidade
    let botaoDeletar = document.createElement('button');

    botaoDeletar.textContent = 'Deletar';
    botaoDeletar.type = 'button';

    botaoDeletar.onclick = function () {
      deletarEsporte(esporte.codigo);
    };

    item.appendChild(document.createTextNode(' '));
    item.appendChild(botaoEditar);

    item.appendChild(document.createTextNode(' '));
    item.appendChild(botaoDeletar);

    lista.appendChild(item);
  }
}

function editarEsporte(esporte) {
  let formulario = document.getElementById('form-esportes');

  formulario.nome.value = esporte.nome;
  formulario.modalidade.value = esporte.modalidade;
  formulario.codigo.value = esporte.codigo;

  modalidade
  codigoDoEsporteEditado = esporte.codigo;

  document.getElementById('botao-submit').textContent = 'Salvar';
  document.getElementById('botao-cancelar').hidden = false;
}

function cancelarEdicao() {
  codigoDoEsporteEditado = null;

  document.getElementById('botao-submit').textContent = 'Enviar';
  document.getElementById('botao-cancelar').hidden = true;
}

function deletarEsporte(codigo) {
  let esportes = JSON.parse(localStorage.getItem('esportes'));

  if (esportes === null) {
    esportes = [];
  }

  let novosEsportes = [];

  for (let i = 0; i < esportes.length; i++) {
    if (esportes[i].codigo !== codigo) {
      novosEsportes.push(esportes[i]);
    }
  }

  localStorage.setItem('esportes', JSON.stringify(novosEsportes));

  listarEsportes();
}

document.getElementById('botao-cancelar').onclick = function () {
  document.getElementById('form-esporte').reset();

  cancelarEdicao();
};

listarEsportes();
