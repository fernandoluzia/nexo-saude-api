
const http = require('http');

const pacientes = [
    { id: 1, nome: 'Maria Oliveira', idade: 42 },
    { id: 2, nome: 'Lucas Correia', idade: 28 },
    { id: 3, nome: 'Fernando Luzia', idade: 23 }
];

const servidor = http.createServer((requisicao, resposta) => {

    // Rota para listar todos os pacientes
    if (requisicao.method === 'GET' && requisicao.url === '/pacientes') {

        resposta.writeHead(200, {
            'Content-Type': 'application/json'
        });

        resposta.end(JSON.stringify(pacientes));
        return;
    }

    // Rota para buscar um paciente pelo ID
    if (requisicao.method === 'GET' && requisicao.url.startsWith('/pacientes/')) {

        const id = Number(requisicao.url.split('/')[2]);

        const paciente = pacientes.find(p => p.id === id);

        if (paciente) {
            resposta.writeHead(200, {
                'Content-Type': 'application/json'
            });

            resposta.end(JSON.stringify(paciente));
            return;
        }
    }

    // Rota para cadastrar um novo paciente
    if (requisicao.method === 'POST' && requisicao.url === '/pacientes') {

        let corpo = '';

        requisicao.on('data', (parte) => {
            corpo += parte;
        });

        requisicao.on('end', () => {
            let novoPaciente;

            try {
                novoPaciente = JSON.parse(corpo);
            } catch (erro) {
                resposta.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                resposta.end(JSON.stringify({
                    mensagem: 'JSON inválido'
                }));
                return;
            }

            if (
                !novoPaciente ||
                typeof novoPaciente.nome !== 'string' ||
                !novoPaciente.nome.trim() ||
                !Number.isInteger(novoPaciente.idade) ||
                novoPaciente.idade < 0
            ) {
                resposta.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                resposta.end(JSON.stringify({
                    mensagem: 'Informe um nome e uma idade válida'
                }));
                return;
            }

            const proximoId = Math.max(0, ...pacientes.map(p => p.id)) + 1;

            const pacienteCadastrado = {
                id: proximoId,
                nome: novoPaciente.nome.trim(),
                idade: novoPaciente.idade
            };

            pacientes.push(pacienteCadastrado);

            resposta.writeHead(201, {
                'Content-Type': 'application/json'
            });

            resposta.end(JSON.stringify(pacienteCadastrado));
        });

        return;
    }

    // Rota não encontrada
    resposta.writeHead(404, {
        'Content-Type': 'application/json'
    });

    resposta.end(JSON.stringify({
        mensagem: 'Rota não encontrada'
    }));

});

servidor.listen(3000, () => {
    console.log('Servidor NEXO Saúde rodando na porta 3000');
});
