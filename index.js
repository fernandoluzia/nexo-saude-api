const http = require('node:http');
const rotasPacientes = require('./src/routes/pacientes');
const servirArquivos = require('./src/utils/arquivos');

const servidor = http.createServer(async (requisicao, resposta) => {
    try {
        if (await rotasPacientes(requisicao, resposta)) return;

        if (await servirArquivos(requisicao, resposta)) return;

        resposta.writeHead(404, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        resposta.end(JSON.stringify({
            mensagem: 'Rota nao encontrada'
        }));

    } catch (erro) {
        console.error(erro);

        resposta.writeHead(500, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        resposta.end(JSON.stringify({
            mensagem: 'Erro interno no servidor'
        }));
    }
});

servidor.listen(3000, '127.0.0.1', () => {
    console.log('Servidor NEXO Saude rodando na porta 3000');
});
