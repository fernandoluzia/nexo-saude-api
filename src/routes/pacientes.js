const db = require('../config/database');

async function rotasPacientes(requisicao, resposta) {

    const metodo = requisicao.method;
    const rota = requisicao.url.split('?')[0];

    const jsonHeader = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    // GET - Listar pacientes
    if (metodo === 'GET' && rota === '/pacientes') {

        const [linhas] = await db.query(
            'SELECT * FROM pacientes ORDER BY nome'
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
                mensagem: 'Informe dados válidos do paciente'
            }));

            return true;
        }

        const paciente = prepararPaciente(dados);

        try {

            const [resultado] = await db.query(
                `INSERT INTO pacientes
                (nome, telefone, servico, cpf, convenio,
                status, data_nascimento, email, endereco,
                sexo, cep, rua, numero, complemento,
                bairro, cidade, estado, nome_emergencia,
                parentesco, telefone_emergencia)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                Object.values(paciente)
            );

            resposta.writeHead(201, jsonHeader);
            resposta.end(JSON.stringify({
                id: resultado.insertId,
                mensagem: 'Paciente cadastrado com sucesso'
            }));

        } catch (erro) {

            if (erro.code === 'ER_DUP_ENTRY') {

                resposta.writeHead(409, jsonHeader);
                resposta.end(JSON.stringify({
                    mensagem: 'CPF já cadastrado'
                }));

                return true;
            }

            throw erro;
        }

        return true;
    }

    // PUT - Atualizar paciente
    if (metodo === 'PUT' && /^\/pacientes\/\d+$/.test(rota)) {

        const id = Number(rota.split('/')[2]);
        const dados = await receberDados(requisicao);

        if (!validarPaciente(dados)) {

            resposta.writeHead(400, jsonHeader);
            resposta.end(JSON.stringify({
                mensagem: 'Informe dados válidos do paciente'
            }));

            return true;
        }

        const paciente = prepararPaciente(dados);

        try {

            const [resultado] = await db.query(
                `UPDATE pacientes SET
                nome = ?,
                telefone = ?,
                servico = ?,
                cpf = ?,
                convenio = ?,
                status = ?,
                data_nascimento = ?,
                email = ?,
                endereco = ?,
                sexo = ?,
                cep = ?,
                rua = ?,
                numero = ?,
                complemento = ?,
                bairro = ?,
                cidade = ?,
                estado = ?,
                nome_emergencia = ?,
                parentesco = ?,
                telefone_emergencia = ?
                WHERE id = ?`,
                [...Object.values(paciente), id]
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
                mensagem: 'Paciente atualizado com sucesso'
            }));

        } catch (erro) {

            if (erro.code === 'ER_DUP_ENTRY') {

                resposta.writeHead(409, jsonHeader);
                resposta.end(JSON.stringify({
                    mensagem: 'CPF já cadastrado'
                }));

                return true;
            }

            throw erro;
        }

        return true;
    }

    // DELETE - Bloqueado até criar as permissões
    if (metodo === 'DELETE' && /^\/pacientes\/\d+$/.test(rota)) {

        resposta.writeHead(403, jsonHeader);
        resposta.end(JSON.stringify({
            mensagem: 'Exclusão não autorizada'
        }));

        return true;
    }

    return false;
}

// Receber dados do frontend
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

// Validar os dados
function validarPaciente(dados) {

    if (!dados ||
        typeof dados.nome !== 'string' ||
        dados.nome.trim() === '' ||
        dados.nome.trim().length > 150 ||
        typeof dados.telefone !== 'string' ||
        dados.telefone.trim() === '' ||
        dados.telefone.trim().length > 20) {

        return false;
    }

    const campos = {
        servico: 100,
        cpf: 14,
        convenio: 100,
        email: 150,
        endereco: 255,
        data_nascimento: 10,
        sexo: 20,
        cep: 9,
        rua: 150,
        numero: 20,
        complemento: 100,
        bairro: 100,
        cidade: 100,
        estado: 2,
        nome_emergencia: 150,
        parentesco: 50,
        telefone_emergencia: 20
    };

    for (const campo in campos) {

        if (dados[campo] != null &&
            (typeof dados[campo] !== 'string' ||
            dados[campo].trim().length > campos[campo])) {

            return false;
        }
    }

    if (dados.status &&
        !['Ativo', 'Inativo'].includes(dados.status)) {

        return false;
    }

    if (dados.cpf &&
        !/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(dados.cpf.trim())) {

        return false;
    }

    if (dados.data_nascimento) {

        const data = dados.data_nascimento;
        const dataValida = new Date(data + 'T00:00:00Z');

        if (!/^\d{4}-\d{2}-\d{2}$/.test(data) ||
            isNaN(dataValida.getTime()) ||
            dataValida.toISOString().slice(0, 10) !== data) {

            return false;
        }
    }

    return true;
}

// Organizar os dados
function prepararPaciente(dados) {

    return {
        nome: dados.nome.trim(),
        telefone: dados.telefone.trim(),
        servico: dados.servico?.trim() || null,
        cpf: dados.cpf?.replace(/\D/g, '') || null,
        convenio: dados.convenio?.trim() || null,
        status: dados.status || 'Ativo',
        data_nascimento: dados.data_nascimento || null,
        email: dados.email?.trim() || null,
        endereco: dados.endereco?.trim() || null,
        sexo: dados.sexo?.trim() || null,
        cep: dados.cep?.trim() || null,
        rua: dados.rua?.trim() || null,
        numero: dados.numero?.trim() || null,
        complemento: dados.complemento?.trim() || null,
        bairro: dados.bairro?.trim() || null,
        cidade: dados.cidade?.trim() || null,
        estado: dados.estado?.trim().toUpperCase() || null,
        nome_emergencia: dados.nome_emergencia?.trim() || null,
        parentesco: dados.parentesco?.trim() || null,
        telefone_emergencia: dados.telefone_emergencia?.trim() || null
    };
}

module.exports = rotasPacientes;