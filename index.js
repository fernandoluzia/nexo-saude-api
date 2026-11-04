const http = require('http');
const db = require('./database');

const servidor = http.createServer(async (requisicao, resposta) => {
    // Configura cabeçalho padrão JSON
    const jsonHeader = { 'Content-Type': 'application/json; charset=utf-8' };

    try {
        // ==============================================
        // GET - Listar todos os pacientes do banco
        // ==============================================
        if (requisicao.method === 'GET' && requisicao.url === '/pacientes') {
            const [linhas] = await db.query('SELECT * FROM pacientes');
            resposta.writeHead(200, jsonHeader);
            resposta.end(JSON.stringify(linhas));
            return;
        }

        // ==============================================
        // GET - Buscar paciente pelo ID
        // ==============================================
        if (requisicao.method === 'GET' && /^\/pacientes\/\d+$/.test(requisicao.url)) {
            const id = Number(requisicao.url.split('/')[2]);
            const [linhas] = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);

            if (linhas.length === 0) {
                resposta.writeHead(404, jsonHeader);
                resposta.end(JSON.stringify({ mensagem: 'Paciente não encontrado' }));
                return;
            }

            resposta.writeHead(200, jsonHeader);
            resposta.end(JSON.stringify(linhas[0]));
            return;
        }

        // ==============================================
        // POST - Cadastrar novo paciente no banco
        // ==============================================
        if (requisicao.method === 'POST' && requisicao.url === '/pacientes') {
            let corpo = '';
            requisicao.on('data', (parte) => { corpo += parte; });

            requisicao.on('end', async () => {
                let novoPaciente;
                try {
                    novoPaciente = JSON.parse(corpo);
                } catch {
                    resposta.writeHead(400, jsonHeader);
                    resposta.end(JSON.stringify({ mensagem: 'JSON inválido' }));
                    return;
                }

                if (!novoPaciente || !novoPaciente.nome || !novoPaciente.nome.trim() || !novoPaciente.telefone) {
                    resposta.writeHead(400, jsonHeader);
                    resposta.end(JSON.stringify({ mensagem: 'Informe ao menos nome e telefone' }));
                    return;
                }

                const nome = novoPaciente.nome.trim();
                const telefone = novoPaciente.telefone.trim();
                const servico = novoPaciente.servico ? novoPaciente.servico.trim() : null;

                const [resultado] = await db.query(
                    'INSERT INTO pacientes (nome, telefone, servico) VALUES (?, ?, ?)',
                    [nome, telefone, servico]
                );

                const pacienteCriado = {
                    id: resultado.insertId,
                    nome,
                    telefone,
                    servico
                };

                resposta.writeHead(201, jsonHeader);
                resposta.end(JSON.stringify(pacienteCriado));
            });
            return;
        }

        // ==============================================
        // PUT - Atualizar paciente pelo ID
        // ==============================================
        if (requisicao.method === 'PUT' && /^\/pacientes\/\d+$/.test(requisicao.url)) {
            const id = Number(requisicao.url.split('/')[2]);
            let corpo = '';
            requisicao.on('data', (parte) => { corpo += parte; });

            requisicao.on('end', async () => {
                let dados;
                try {
                    dados = JSON.parse(corpo);
                } catch {
                    resposta.writeHead(400, jsonHeader);
                    resposta.end(JSON.stringify({ mensagem: 'JSON inválido' }));
                    return;
                }

                if (!dados || !dados.nome || !dados.telefone) {
                    resposta.writeHead(400, jsonHeader);
                    resposta.end(JSON.stringify({ mensagem: 'Informe nome e telefone válidos' }));
                    return;
                }

                const nome = dados.nome.trim();
                const telefone = dados.telefone.trim();
                const servico = dados.servico ? dados.servico.trim() : null;

                const [resultado] = await db.query(
                    'UPDATE pacientes SET nome = ?, telefone = ?, servico = ? WHERE id = ?',
                    [nome, telefone, servico, id]
                );

                if (resultado.affectedRows === 0) {
                    resposta.writeHead(404, jsonHeader);
                    resposta.end(JSON.stringify({ mensagem: 'Paciente não encontrado' }));
                    return;
                }

                resposta.writeHead(200, jsonHeader);
                resposta.end(JSON.stringify({ id, nome, telefone, servico }));
            });
            return;
        }

        // ==============================================
        // DELETE - Excluir paciente pelo ID
        // ==============================================
        if (requisicao.method === 'DELETE' && /^\/pacientes\/\d+$/.test(requisicao.url)) {
            const id = Number(requisicao.url.split('/')[2]);
            const [resultado] = await db.query('DELETE FROM pacientes WHERE id = ?', [id]);

            if (resultado.affectedRows === 0) {
                resposta.writeHead(404, jsonHeader);
                resposta.end(JSON.stringify({ mensagem: 'Paciente não encontrado' }));
                return;
            }

            resposta.writeHead(200, jsonHeader);
            resposta.end(JSON.stringify({ mensagem: 'Paciente excluído com sucesso' }));
            return;
        }

        // Rota não encontrada
        resposta.writeHead(404, jsonHeader);
        resposta.end(JSON.stringify({ mensagem: 'Rota não encontrada' }));

    } catch (erro) {
        console.error('Erro no servidor:', erro);
        resposta.writeHead(500, jsonHeader);
        resposta.end(JSON.stringify({ mensagem: 'Erro interno no servidor' }));
    }
});

servidor.listen(3000, () => {
    console.log('Servidor NEXO Saúde rodando na porta 3000 conectado ao MySQL');
});
