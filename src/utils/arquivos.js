const fs = require('node:fs/promises');
const path = require('node:path');

// Pastas do projeto
const raiz = path.resolve(__dirname, '../..');
const pastaPublic = path.join(raiz, 'public');
const pastaViews = path.join(raiz, 'src', 'views');

// Tipos de arquivos
const tiposArquivo = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon'
};

// Telas do sistema
const telas = {
    '/': 'home.html',
    '/home.html': 'home.html',
    '/login.html': 'login.html',
    '/dashboard.html': 'dashboard.html',
    '/pacientes.html': 'pacientes.html',
    '/cadastro-paciente.html': 'cadastro-paciente.html',
    '/consultas.html': 'consultas.html',
    '/anamnese.html': 'anamnese.html',
    '/usuarios.html': 'usuarios.html',
    '/configuracoes.html': 'configuracoes.html'
};

// Carrega os arquivos
async function servirArquivos(requisicao, resposta) {

    if (requisicao.method !== 'GET') {
        return false;
    }

    const rota = requisicao.url.split('?')[0];

    let arquivo;

    // Carrega as telas
    if (Object.hasOwn(telas, rota)) {

        arquivo = path.join(pastaViews, telas[rota]);

    } else if (
        rota.startsWith('/css/') ||
        rota.startsWith('/js/') ||
        rota.startsWith('/assets/') ||
        rota.startsWith('/img/')
    ) {

        arquivo = path.resolve(pastaPublic, '.' + rota);

        // Protege as pastas do projeto
        if (!arquivo.startsWith(pastaPublic + path.sep)) {
            return false;
        }

    } else {
        return false;
    }

    try {

        const conteudo = await fs.readFile(arquivo);
        const extensao = path.extname(arquivo).toLowerCase();

        // Reprodução dos vídeos
        if (extensao === '.mp4' && requisicao.headers.range) {

            const tamanho = conteudo.length;

            const partes = /^bytes=(\d*)-(\d*)$/.exec(
                requisicao.headers.range
            );

            if (!partes || (!partes[1] && !partes[2])) {

                resposta.writeHead(416, {
                    'Content-Range': `bytes */${tamanho}`
                });

                resposta.end();
                return true;
            }

            const inicio = partes[1]
                ? Number(partes[1])
                : Math.max(0, tamanho - Number(partes[2]));

            const fim = partes[1] && partes[2]
                ? Math.min(Number(partes[2]), tamanho - 1)
                : tamanho - 1;

            if (
                !Number.isInteger(inicio) ||
                !Number.isInteger(fim) ||
                inicio < 0 ||
                inicio > fim ||
                inicio >= tamanho
            ) {

                resposta.writeHead(416, {
                    'Content-Range': `bytes */${tamanho}`
                });

                resposta.end();
                return true;
            }

            resposta.writeHead(206, {
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Content-Range': `bytes ${inicio}-${fim}/${tamanho}`,
                'Content-Length': fim - inicio + 1
            });

            resposta.end(conteudo.subarray(inicio, fim + 1));

            return true;
        }

        // Carrega os outros arquivos
        const cabecalhos = {
            'Content-Type': tiposArquivo[extensao] ||
                'application/octet-stream',
            'Content-Length': conteudo.length
        };

        if (extensao === '.mp4') {
            cabecalhos['Accept-Ranges'] = 'bytes';
        }

        resposta.writeHead(200, cabecalhos);
        resposta.end(conteudo);

        return true;

    } catch (erro) {

        if (erro.code === 'ENOENT' || erro.code === 'EISDIR') {
            return false;
        }

        throw erro;
    }
}

module.exports = servirArquivos;