const tabela = document.getElementById('tabela-pacientes');
const total = document.getElementById('total-pacientes');

const busca = document.getElementById('busca');
const filtroStatus = document.getElementById('filtro-status');
const filtroConvenio = document.getElementById('filtro-convenio');

let listaPacientes = [];

// Buscar pacientes na API
async function carregarPacientes() {

    try {

        const resposta = await fetch('/pacientes');

        if (!resposta.ok) {
            throw new Error('Erro ao buscar pacientes');
        }

        listaPacientes = await resposta.json();

        filtrarPacientes();

    } catch (erro) {

        console.error(erro);

        total.textContent = 'Erro ao carregar pacientes';

    }
}

// Filtrar pacientes
function filtrarPacientes() {

    const texto = busca.value.toLowerCase().trim();
    const status = filtroStatus.value;
    const convenio = filtroConvenio.value;

    const pacientesFiltrados = listaPacientes.filter(paciente => {

        const nome = paciente.nome.toLowerCase();
        const cpf = paciente.cpf || '';
        const prontuario = String(paciente.id).padStart(6, '0');
        const textoCPF = texto.replace(/[.-]/g, '');

        const correspondeBusca =
            nome.includes(texto) ||
            (textoCPF !== '' && cpf.includes(textoCPF)) ||
            prontuario.includes(texto);

        const correspondeStatus =
            status === '' || paciente.status === status;

        const correspondeConvenio =
            convenio === '' || paciente.convenio === convenio;

        return correspondeBusca &&
            correspondeStatus &&
            correspondeConvenio;

    });

    exibirPacientes(pacientesFiltrados);
}

// Preencher a tabela
function exibirPacientes(pacientes) {

    tabela.innerHTML = '';

    pacientes.forEach(paciente => {

        const linha = document.createElement('tr');

        const dados = [
            String(paciente.id).padStart(6, '0'),
            paciente.nome,
            formatarCPF(paciente.cpf),
            paciente.telefone,
            paciente.convenio || '-',
            formatarData(paciente.data_cadastro),
            '-'
        ];

        dados.forEach(dado => {

            const coluna = document.createElement('td');

            coluna.textContent = dado;

            linha.appendChild(coluna);

        });

        // Botão de editar
        const colunaAcoes = document.createElement('td');

        const editar = document.createElement('a');

        editar.textContent = 'Editar';
        editar.className = 'botao-editar';
        editar.href = 'cadastro-paciente.html?id=' + paciente.id;

        colunaAcoes.appendChild(editar);

        linha.appendChild(colunaAcoes);

        tabela.appendChild(linha);

    });

    total.textContent =
        `Mostrando ${pacientes.length} de ${listaPacientes.length} pacientes`;

    if (pacientes.length === 0) {

        const linha = document.createElement('tr');
        const coluna = document.createElement('td');

        coluna.colSpan = 8;
        coluna.textContent = 'Nenhum paciente encontrado';
        coluna.style.textAlign = 'center';

        linha.appendChild(coluna);
        tabela.appendChild(linha);

    }
}

// Formatar data
function formatarData(data) {

    if (!data) {
        return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
}

// Formatar CPF
function formatarCPF(cpf) {

    if (!cpf) {
        return '-';
    }

    return cpf.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        '$1.$2.$3-$4'
    );
}

// Eventos dos filtros
busca.addEventListener('input', filtrarPacientes);

filtroStatus.addEventListener('change', filtrarPacientes);

filtroConvenio.addEventListener('change', filtrarPacientes);

carregarPacientes();