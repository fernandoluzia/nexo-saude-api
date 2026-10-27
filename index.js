
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

