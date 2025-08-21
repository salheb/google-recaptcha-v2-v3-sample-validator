const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'ReCAPTCHA Validation Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rota principal para validação do ReCAPTCHA
app.post('/verify-recaptcha', async (req, res) => {
    try {
        const { token, secretKey, remoteip } = req.body;
        
        // Validação dos dados de entrada
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token do ReCAPTCHA é obrigatório',
                error_code: 'MISSING_TOKEN'
            });
        }
        
        if (!secretKey) {
            return res.status(400).json({
                success: false,
                error: 'Secret key é obrigatória',
                error_code: 'MISSING_SECRET_KEY'
            });
        }
        
        // IP do cliente (com fallback)
        const clientIP = remoteip || req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        console.log(`Validando ReCAPTCHA para IP: ${clientIP}`);
        console.log(`Token: ${token.substring(0, 20)}...`);
        console.log(`Secret Key: ${secretKey.substring(0, 10)}...`);
        
        // Preparar dados para a API do Google
        const params = new URLSearchParams({
            secret: secretKey,
            response: token,
            remoteip: clientIP
        });
        
        // Fazer requisição para a API do Google ReCAPTCHA
        const startTime = Date.now();
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
            timeout: 10000 // 10 segundos de timeout
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (!response.ok) {
            console.error(`Erro HTTP da API Google: ${response.status} ${response.statusText}`);
            return res.status(502).json({
                success: false,
                error: `Erro na API do Google: ${response.status} ${response.statusText}`,
                error_code: 'GOOGLE_API_ERROR',
                http_status: response.status
            });
        }
        
        const data = await response.json();
        
        // Log da resposta
        console.log(`Resposta da API Google (${duration}ms):`, JSON.stringify(data, null, 2));
        
        // Adicionar informações extras à resposta
        const enhancedResponse = {
            ...data,
            validation_info: {
                client_ip: clientIP,
                response_time_ms: duration,
                validated_at: new Date().toISOString(),
                backend_version: '1.0.0'
            }
        };
        
        // Status HTTP baseado no resultado
        const statusCode = data.success ? 200 : 400;
        
        res.status(statusCode).json(enhancedResponse);
        
    } catch (error) {
        console.error('Erro na validação do ReCAPTCHA:', error);
        
        let errorMessage = 'Erro interno do servidor';
        let errorCode = 'INTERNAL_ERROR';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Timeout na requisição para API do Google';
            errorCode = 'TIMEOUT_ERROR';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Erro de rede ao conectar com API do Google';
            errorCode = 'NETWORK_ERROR';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            error_code: errorCode,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        error_code: 'UNHANDLED_ERROR'
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        error_code: 'NOT_FOUND',
        available_endpoints: [
            'GET /health',
            'POST /verify-recaptcha'
        ]
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 ReCAPTCHA Validation Backend iniciado!');
    console.log(`📡 Servidor rodando na porta: ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Endpoint de validação: http://localhost:${PORT}/verify-recaptcha`);
    console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
});

// Tratamento graceful de desligamento
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, desligando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, desligando servidor...');
    process.exit(0);
});
