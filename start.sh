#!/bin/bash

# AVISO: Este script inicia o backend (Node.js) e o frontend (http-server) em servidores separados.
# O frontend será servido na porta 8080 e o backend na porta 3001.

set -e

FRONTEND_PORT=8080
BACKEND_PORT=3001

# Função para checar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para encerrar ambos os servidores
cleanup() {
    echo -e "\n🛑 Encerrando servidores..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}

# Registrar trap corretamente para SIGINT
trap cleanup INT

# Iniciar Backend
start_backend() {
    echo -e "\n🚀 Iniciando ReCAPTCHA Validation Backend..."
    if [ ! -d "backend" ]; then
        echo "❌ Pasta 'backend' não encontrada!"
        echo "💡 Execute este script na pasta raiz do projeto"
        exit 1
    fi
    cd backend
    if [ ! -f "package.json" ]; then
        echo "❌ package.json não encontrado na pasta backend!"
        exit 1
    fi
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências do backend..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Falha ao instalar dependências do backend!"
            exit 1
        fi
        echo "✅ Dependências do backend instaladas com sucesso!"
    fi
    echo "🌟 Iniciando backend na porta $BACKEND_PORT..."
    npm start &
    BACKEND_PID=$!
    cd ..
}

# Iniciar Frontend
start_frontend() {
    echo -e "\n🌐 Iniciando servidor do frontend (http-server) na porta $FRONTEND_PORT..."
    if [ ! -d "frontend" ]; then
        echo "❌ Pasta 'frontend' não encontrada!"
        exit 1
    fi
    if ! command_exists npx; then
        echo "❌ 'npx' não encontrado. Instale o Node.js e o npm."
        exit 1
    fi
    cd frontend
    npx http-server -p $FRONTEND_PORT --cors &
    FRONTEND_PID=$!
    cd ..
}

# Iniciar ambos
start_backend
start_frontend

sleep 2

# Mensagens finais
cat <<EOF

============================================
✅ Servidores iniciados com sucesso!

🔗 Frontend:  http://localhost:$FRONTEND_PORT
🔗 Backend:   http://localhost:$BACKEND_PORT
🔗 Health Check Backend: http://localhost:$BACKEND_PORT/health

⚡ Para parar ambos os servidores, pressione Ctrl+C
============================================

EOF

# Esperar ambos
wait $BACKEND_PID $FRONTEND_PID
