#!/bin/bash

echo "🔧 Iniciando configuração do ambiente com PM2..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null
then
    echo "⚠️ PM2 não encontrado. Instalando globalmente..."
    npm install -g pm2
fi

# Acessar a pasta do projeto (ajustável)
cd /var/www/html || exit 1

# Instalar dependências se necessário
echo "📦 Instalando dependências (se necessário)..."
npm install express socket.io

# Iniciar o servidor com PM2
echo "🚀 Iniciando o servidor com PM2..."
pm2 start server.js --name live-chat

# Salvar o processo para iniciar com o sistema
pm2 save

# Habilitar PM2 no boot
echo "🧰 Configurando PM2 para iniciar com o sistema..."
pm2 startup | grep sudo | bash

echo "✅ Configuração finalizada! O servidor live-chat está ativo e persistente."
