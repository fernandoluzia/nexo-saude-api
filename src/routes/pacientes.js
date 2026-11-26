const db = require('../config/database');

// Função responsável pelas rotas de pacientes
async function rotasPacientes(requisicao, resposta) {

    const metodo = requisicao.method;
    const rota = requisicao.url.split('?')[0];

    const jsonHeader = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    // GET - Listar todos os pacientes
    if (metodo === 'GET' && rota === '/pacientes') {

        const [linhas] = await db.query(
            'SELECT * FROM pacientes'
        );

        resposta.writeHead(200, jsonHeader);
        resposta.end(JSON.stringify(linhas));

        return true;
    }

    // GET - Buscar paciente pelo ID
    if (metodo === 'GET' && /^\/pacientes\/\d+$/.test(rota)) {

        const id = Number(rota.split('/')[2]);

        const [linhas] = await db.query(
            'SELECT * FROM pacientes WHERE id = ?',
            [id]
        );

        if (linhas.length === 0) {
            resposta.writeHead(404, jsonHeader);
            resposta.end(JSON.stringify({
                mensagem: 'Paciente não encontrado'
            }));

            return true;
        }

        resposta.writeHead(200, jsonHeader);
        resposta.end(JSON.stringify(linhas[0]));

        return true;
    }

    // POST - Cadastrar paciente
    if (metodo === 'POST' && rota === '/pacientes') {

        const dados = await receberDados(requisicao);

        if (!validarPaciente(dados)) {
            resposta.writeHead(400, jsonHeader);
            resposta.end(JSON.stringify({
                mensagem: 'Informe nome e telefone válidos'
            }));

            return true;
        }

        const nome = dados.nome.trim();
        const telefone = dados.telefone.trim();
        const servico = dados.servico || null;

        const [resultado] = await db.query(
            'INSERT INTO pacientes (nome, telefone, servico) VALUES (?, ?, ?)',
            [nome, telefone, servico]
        );

        resposta.writeHead(201, jsonHeader);
        resposta.end(JSON.stringify({
            id: resultado.insertId,
            nome,
            telefone,
            servico
        }));

        return true;
    }

    // PUT - Atualizar paciente
    if (metodo === 'PUT' && /^\/pacientes\/\d+$/.test(rota)) {

        const id = Number(rota.split('/')[2]);
        const dados = await receberDados(requisicao);

        if (!validarPaciente(dados)) {
            resposta.writeHead(400, jsonHeader);
            resposta.end(JSON.stringify({
                mensagem: 'Informe nome e telefone válidos'
            }));

            return true;
        }

        const nome = dados.nome.trim();
        const telefone = dados.telefone.trim();
        const servico = dados.servico || null;

        const [resultado] = await db.query(
            'UPDATE pacientes SET nome = ?, telefone = ?, servico = ? WHERE id = ?',
            [nome, telefone, servico, id]
        );

        if (resultado.affectedRows === 0) {
            resposta.writeHead(404, jsonHeader);
            resposta.end(JSON.stringify({
                mensagem: 'Paciente não encontrado'
            }));

            return true;
        }

        resposta.writeHead(200, jsonHeader);
        resposta.end(JSON.stringify({
            id,
            nome,
            telefone,
            servico
        }));

        return true;
    }

    // DELETE - Excluir paciente
    if (metodo === 'DELETE' && /^\/pacientes\/\d+$/.test(rota)) {

        const id = Number(rota.split('/')[2]);

        const [resultado] = await db.query(
            'DELETE FROM pacientes WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            resposta.writeHead(404, jsonHeader);
            resposta.end(JSON.stringify({
                mensagem: 'Paciente não encontrado'
            }));

            return true;
        }

        resposta.writeHead(200, jsonHeader);
        resposta.end(JSON.stringify({
            mensagem: 'Paciente excluído com sucesso'
        }));

        return true;
    }

    // Informa que nenhuma rota foi encontrada
    return false;
}

// Função para receber os dados enviados pelo frontend
async function receberDados(requisicao) {

    let corpo = '';

    for await (const parte of requisicao) {
        corpo += parte;
    }

    try {
        return JSON.parse(corpo);
    } catch {
        return null;
    }
}

// Função para validar os dados do paciente
function validarPaciente(dados) {

    return dados &&
        typeof dados.nome === 'string' &&
        dados.nome.trim() !== '' &&
        typeof dados.telefone === 'string' &&
        dados.telefone.trim() !== '' &&
        (
            dados.servico == null ||
            typeof dados.servico === 'string'
        );
}

// Exporta as rotas para o servidor principal
module.exports = rotasPacientes;