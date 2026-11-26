const formulario = document.getElementById('form-paciente');

const parametros = new URLSearchParams(window.location.search);
const id = parametros.get('id');

const botao = document.querySelector('.cadastrar');

let pacienteOriginal = null;

// Carregar os dados para editar
async function carregarPaciente() {

    botao.disabled = true;

    try {

        const resposta = await fetch('/pacientes/' + id);

        if (!resposta.ok) {
            throw new Error('Paciente nao encontrado');
        }

        pacienteOriginal = await resposta.json();

        for (const campo of formulario.elements) {

            if (!campo.name) {
                continue;
            }

            let valor = pacienteOriginal[campo.name] ?? '';

            if (campo.name === 'data_nascimento' && valor) {
                valor = valor.slice(0, 10);
            }

            if (campo.tagName === 'SELECT' && valor) {

                const existe = Array.from(campo.options).some(
                    opcao => opcao.value === valor
                );

                if (!existe) {
                    campo.add(new Option(valor, valor));
                }
            }

            campo.value = valor;
        }

        botao.disabled = false;

    } catch (erro) {

        alert('Erro ao carregar paciente');
        console.error(erro);

        window.location.href = '/pacientes.html';

    }
}

// Identificar se estamos editando
if (id !== null) {

    document.querySelector('h1').textContent = 'Editar Paciente';

    document.querySelector('.cabecalho p').textContent =
        'Atualize os dados do paciente.';

    botao.textContent = 'Salvar Alteracoes';

    document.title = 'NEXO Saúde - Editar Paciente';

    carregarPaciente();
}

// Cadastrar ou atualizar
formulario.addEventListener('submit', async function (evento) {

    evento.preventDefault();

    if (id !== null && !pacienteOriginal) {
        return;
    }

    const dados = new FormData(formulario);
    const paciente = Object.fromEntries(dados);

    if (pacienteOriginal) {
        paciente.endereco = pacienteOriginal.endereco;
    }

    const url = id !== null
        ? '/pacientes/' + id
        : '/pacientes';

    const metodo = id !== null ? 'PUT' : 'POST';

    botao.disabled = true;

    try {

        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paciente)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {

            alert(resultado.mensagem);

            window.location.href = '/pacientes.html';

        } else {

            alert(resultado.mensagem);

        }

    } catch (erro) {

        alert('Erro ao salvar paciente');

        console.error(erro);

    } finally {

        botao.disabled = false;

    }

});
