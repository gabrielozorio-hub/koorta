let sessaoEmEdicao = null; 





function salvarDados() {
    let nomeInput = document.getElementById('nomeSessao');
    let pessoasInput = document.getElementById('pessoas');
    let dataInput = document.getElementById('dataSessao');

    let sessao = {
        nome: nomeInput.value,
        quantidade: pessoasInput.value,
        data: dataInput.value
    };

    let listaSessoes = JSON.parse(localStorage.getItem('Sessao')) || [];

    if (sessaoEmEdicao === null) {
        listaSessoes.push(sessao);
    } else {
        for (let i = 0; i < listaSessoes.length; i++) {
            if (listaSessoes[i].nome === sessaoEmEdicao) {
                listaSessoes[i] = sessao;
            }
        }
    }

    localStorage.setItem('Sessao', JSON.stringify(listaSessoes));

    limparFormulario();
    listarSessao();
};

function limparFormulario() {
    document.getElementById('nomeSessao').value = '';
    document.getElementById('pessoas').value = '';
    document.getElementById('dataSessao').value = '';

    sessaoEmEdicao = null;

    let botaoSalvar = document.querySelector('button[onclick="salvarDados()"]');
    if (botaoSalvar) {
        botaoSalvar.textContent = 'Salvar';
    }
};







function listarSessao() {
    let lista = document.getElementById('resultados');
    let listaSessoes = JSON.parse(localStorage.getItem('Sessao')) || [];

    lista.innerHTML = '';

    listaSessoes.forEach(sessao => {
        let item = document.createElement('li');

        item.textContent = 'Nome: ' + sessao.nome + ' - Pessoas: ' + sessao.quantidade + ' - Data: ' + sessao.data;

        let botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.type = 'button';
        botaoEditar.onclick = function () {
            editarSessao(sessao);
        };

        let botaoDeletar = document.createElement('button');
        botaoDeletar.textContent = 'Deletar';
        botaoDeletar.type = 'button';
        botaoDeletar.onclick = function () {
            deletarSessao(sessao.nome);
        };

        item.appendChild(document.createTextNode(' '));
        item.appendChild(botaoEditar);
        item.appendChild(document.createTextNode(' '));
        item.appendChild(botaoDeletar);
        lista.appendChild(item);
    });
};







function editarSessao(sessao) {
    document.getElementById('nomeSessao').value = sessao.nome;
    document.getElementById('pessoas').value = sessao.quantidade;
    document.getElementById('dataSessao').value = sessao.data;

    sessaoEmEdicao = sessao.nome;

    let botaoSalvar = document.querySelector('button[onclick="salvarDados()"]');
    if (botaoSalvar) {
        botaoSalvar.textContent = 'Atualizar';
    }
};







function deletarSessao(nome) {
    let listaSessoes = JSON.parse(localStorage.getItem('Sessao')) || [];
    let novaLista = listaSessoes.filter(sessao => sessao.nome !== nome);

    localStorage.setItem('Sessao', JSON.stringify(novaLista));

    if (sessaoEmEdicao === nome) {
        limparFormulario();
    }

    listarSessao();
};







listarSessao();