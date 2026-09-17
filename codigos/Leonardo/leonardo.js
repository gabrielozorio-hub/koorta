let emailDoUsuarioEditado = null;

function lidarComSubmit(event) {
    event.preventDefault();

    let formulario = event.target;

    let usuario = {
        nome: formulario.nome.value,
        email: formulario.email.value,
        senha: formulario.senha.value,
        telefone: formulario.telefone.value
    };

    let usuarios = JSON.parse(localStorage.getItem('usuarios'));

    if (usuarios === null) {
        usuarios = [];
    }

    if (emailDoUsuarioEditado === null) {
        usuarios.push(usuario);
    } else {
        for (let i = 0; i < usuarios.length; i++) {

            if (usuarios[i].email === emailDoUsuarioEditado) {
                usuarios[i] = usuario;
            }

        }
    }

    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    formulario.reset();

    cancelarEdicao();

    listarUsuarios();
}


function listarUsuarios() {

    let lista = document.getElementById('lista-usuarios');

    let usuarios = JSON.parse(localStorage.getItem('usuarios'));

    if (usuarios === null) {
        usuarios = [];
    }

    lista.innerHTML = '';

    for (let i = 0; i < usuarios.length; i++) {

        let usuario = usuarios[i];

        let item = document.createElement('li');

        item.textContent =
            usuario.nome +
            ' - ' +
            usuario.email +
            ' - Telefone: ' +
            usuario.telefone;

        let botaoEditar = document.createElement('button');

        botaoEditar.textContent = 'Editar';

        botaoEditar.type = 'button';

        botaoEditar.onclick = function() {
            editarUsuario(usuario);
        };


        let botaoDeletar = document.createElement('button');

        botaoDeletar.textContent = 'Deletar';

        botaoDeletar.type = 'button';

        botaoDeletar.onclick = function() {
            deletarUsuario(usuario.email);
        };


        item.appendChild(document.createTextNode(' '));

        item.appendChild(botaoEditar);

        item.appendChild(document.createTextNode(' '));

        item.appendChild(botaoDeletar);

        lista.appendChild(item);
    }
}


function editarUsuario(usuario) {

    let formulario = document.getElementById('form-usuario');

    formulario.nome.value = usuario.nome;

    formulario.email.value = usuario.email;

    formulario.senha.value = usuario.senha;

    formulario.telefone.value = usuario.telefone;

    emailDoUsuarioEditado = usuario.email;

    document.getElementById('botao-submit').textContent = 'Salvar';

    document.getElementById('botao-cancelar').hidden = false;
}


function cancelarEdicao() {

    emailDoUsuarioEditado = null;

    document.getElementById('botao-submit').textContent = 'Enviar';

    document.getElementById('botao-cancelar').hidden = true;
}


function deletarUsuario(email) {

    let usuarios = JSON.parse(localStorage.getItem('usuarios'));

    let novosUsuarios = [];

    if (usuarios === null) {
        usuarios = [];
    }

    for (let i = 0; i < usuarios.length; i++) {

        if (usuarios[i].email !== email) {
            novosUsuarios.push(usuarios[i]);
        }

    }

    localStorage.setItem('usuarios', JSON.stringify(novosUsuarios));

    listarUsuarios();
}


document.getElementById('botao-cancelar').onclick = function() {

    document.getElementById('form-usuario').reset();

    cancelarEdicao();

};


listarUsuarios();