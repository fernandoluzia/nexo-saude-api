const fs = require('node:fs/promises');
const path = require('node:path');

// Localização das pastas do projeto
const raiz = path.resolve(__dirname, '../..');
const pastaPublic = path.join(raiz, 'public');
const pastaViews = path.join(raiz, 'src', 'views');

// Tipos de arquivos aceitos pelo navegador
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

// Telas disponíveis no sistema
const telas = {
    '/': 'login.html',
    '/login.html': 'login.html',
    '/dashboard.html': 'dashboard.html',
    '/pacientes.html': 'pacientes.html',
    '/consultas.html': 'consultas.html',
    '/anamnese.html': 'anamnese.html',
    '/usuarios.html': 'usuarios.html',
    '/configuracoes.html': 'configuracoes.html'
};

// Função para entregar arquivos ao navegador
async function servirArquivos(requisicao, resposta) {

    if (requisicao.method !== 'GET') {
        return false;
    }

    const rota = requisicao.url.split('?')[0];

    let arquivo;

    // Verifica se a rota corresponde a uma tela
    if (Object.hasOwn(telas, rota)) {

        arquivo = path.join(pastaViews, telas[rota]);

    } else if (
        rota.startsWith('/css/') ||
        rota.startsWith('/js/') ||
        rota.startsWith('/assets/')
    ) {

        arquivo = path.resolve(pastaPublic, '.' + rota);

        // Impede acesso fora da pasta public
        if (!arquivo.startsWith(pastaPublic + path.sep)) {
            return false;
        }

    } else {
        return false;
    }

    try {

        const conteudo = await fs.readFile(arquivo);
        const extensao = path.extname(arquivo).toLowerCase();

        // Reprodução de vídeos MP4
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

        // Carregamento dos demais arquivos
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