CREATE DATABASE IF NOT EXISTS nexo_saude;

USE nexo_saude;

CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    servico VARCHAR(100),
    cpf VARCHAR(14) UNIQUE,
    convenio VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Ativo',
    data_nascimento DATE,
    email VARCHAR(150),
    endereco VARCHAR(255),
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sexo VARCHAR(20),
    cep VARCHAR(9),
    rua VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    nome_emergencia VARCHAR(150),
    parentesco VARCHAR(50),
    telefone_emergencia VARCHAR(20)
);