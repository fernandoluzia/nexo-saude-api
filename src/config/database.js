const mysql = require('mysql2');

// Configuração da conexão com o phpMyAdmin / MySQL local
const pool = mysql.createPool({
    host: 'localhost',
    port: 3307,
    user: 'root',      // usuário padrão do XAMPP/WAMP
    password: '',      // senha padrão (em branco no XAMPP)
    database: 'nexo_saude',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
