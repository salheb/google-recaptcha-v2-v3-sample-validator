class ReCAPTCHAv2Validator {
    constructor() {
        this.widgetId = null;
        this.currentResponse = null;
        this.isRecaptchaReady = false;
        this.userIP = null;
        
        this.initializeElements();
        this.bindEvents();
        this.waitForRecaptchaReady();
        this.getUserIP();
        
        this.log('Sistema ReCAPTCHA v2 iniciado', 'info');
    }

    initializeElements() {
        this.siteKeyInput = document.getElementById('siteKeyV2');
        this.secretKeyInput = document.getElementById('secretKeyV2');
        this.themeSelect = document.getElementById('theme');
        this.sizeSelect = document.getElementById('size');
        this.recaptchaContainer = document.getElementById('recaptcha-container');
        this.validateBtn = document.getElementById('validateBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.responseOutput = document.getElementById('responseOutput');
        this.copyResponseBtn = document.getElementById('copyResponseBtn');
        this.serverValidation = document.getElementById('serverValidation');
        this.simulateValidationBtn = document.getElementById('simulateValidationBtn');
        this.clearLogsBtn = document.getElementById('clearLogsBtn');
        this.logsContainer = document.getElementById('logs');
    }

    bindEvents() {
        this.validateBtn.addEventListener('click', () => this.validateRecaptcha());
        this.resetBtn.addEventListener('click', () => this.resetRecaptcha());
        this.copyResponseBtn.addEventListener('click', () => this.copyResponse());
        this.simulateValidationBtn.addEventListener('click', () => this.simulateServerValidation());
        this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        
        // Eventos para reconfiguração
        this.siteKeyInput.addEventListener('input', () => this.debounceReconfiguration());
        this.themeSelect.addEventListener('change', () => this.reconfigureRecaptcha());
        this.sizeSelect.addEventListener('change', () => this.reconfigureRecaptcha());
    }

    async getUserIP() {
        try {
            this.log('Obtendo IP do usuário...', 'info');
            
            // Tenta vários serviços de IP para maior confiabilidade
            const ipServices = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://api.myip.com',
                'https://httpbin.org/ip'
            ];
            
            for (const service of ipServices) {
                try {
                    const response = await fetch(service, {
                        method: 'GET',
                        timeout: 5000
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Diferentes serviços retornam o IP em campos diferentes
                        const ip = data.ip || data.origin || data.query || data.ipAddress;
                        
                        if (ip && this.isValidIP(ip)) {
                            this.userIP = ip;
                            this.log(`IP do usuário obtido: ${ip}`, 'success');
                            return;
                        }
                    }
                } catch (serviceError) {
                    console.warn(`Falha no serviço ${service}:`, serviceError);
                    continue;
                }
            }
            
            // Se todos os serviços falharam
            throw new Error('Todos os serviços de IP falharam');
            
        } catch (error) {
            console.error('Erro ao obter IP do usuário:', error);
            this.log('Falha ao obter IP real - usando IP padrão', 'warning');
            this.userIP = 'client-ip-unavailable';
        }
    }

    isValidIP(ip) {
        // Validação básica de IPv4 e IPv6
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        if (ipv4Regex.test(ip)) {
            // Validar se os octetos estão no range correto (0-255)
            const octets = ip.split('.');
            return octets.every(octet => parseInt(octet) >= 0 && parseInt(octet) <= 255);
        }
        
        return ipv6Regex.test(ip);
    }

    waitForRecaptchaReady() {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkRecaptcha = () => {
            attempts++;
            
            if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
                this.isRecaptchaReady = true;
                this.renderRecaptcha();
                this.log('API do Google ReCAPTCHA carregada com sucesso', 'success');
            } else if (attempts >= maxAttempts) {
                this.log('Falha ao carregar a API do Google ReCAPTCHA', 'error');
                this.showRecaptchaError('Falha ao carregar ReCAPTCHA');
            } else {
                setTimeout(checkRecaptcha, 100);
            }
        };
        
        checkRecaptcha();
    }

    renderRecaptcha() {
        if (!this.isRecaptchaReady) return;
        
        const siteKey = this.siteKeyInput.value.trim();
        if (!siteKey) {
            this.showRecaptchaError('Chave do site não fornecida');
            return;
        }

        try {
            // Limpar container
            this.recaptchaContainer.innerHTML = '';
            
            // Renderizar ReCAPTCHA
            this.widgetId = grecaptcha.render(this.recaptchaContainer, {
                'sitekey': siteKey,
                'theme': this.themeSelect.value,
                'size': this.sizeSelect.value,
                'callback': (response) => this.onRecaptchaSuccess(response),
                'expired-callback': () => this.onRecaptchaExpired(),
                'error-callback': () => this.onRecaptchaError()
            });
            
            this.log(`ReCAPTCHA renderizado - Widget ID: ${this.widgetId}`, 'info');
            
        } catch (error) {
            console.error('Erro ao renderizar ReCAPTCHA:', error);
            this.log(`Erro ao renderizar ReCAPTCHA: ${error.message}`, 'error');
            this.showRecaptchaError('Erro ao renderizar ReCAPTCHA');
        }
    }

    onRecaptchaSuccess(response) {
        this.currentResponse = response;
        this.responseOutput.value = response;
        this.validateBtn.disabled = false;
        this.copyResponseBtn.disabled = false;
        this.simulateValidationBtn.disabled = false;
        
        this.log('Token ReCAPTCHA gerado com sucesso', 'success');
        this.log(`Token: ${response.substring(0, 50)}...`, 'info');
        
        this.showMessage('ReCAPTCHA completado com sucesso!', 'success');
    }

    onRecaptchaExpired() {
        this.currentResponse = null;
        this.responseOutput.value = '';
        this.validateBtn.disabled = true;
        this.copyResponseBtn.disabled = true;
        this.simulateValidationBtn.disabled = true;
        
        this.log('Token ReCAPTCHA expirado', 'warning');
        this.showMessage('ReCAPTCHA expirado. Por favor, resolva novamente.', 'error');
        
        this.resetServerValidation();
    }

    onRecaptchaError() {
        this.log('Erro no ReCAPTCHA', 'error');
        this.showMessage('Erro no ReCAPTCHA. Tente novamente.', 'error');
    }

    validateRecaptcha() {
        if (!this.currentResponse) {
            this.showMessage('Nenhuma resposta do ReCAPTCHA disponível', 'error');
            return;
        }

        const responseInfo = {
            token: this.currentResponse,
            length: this.currentResponse.length,
            generated_at: new Date().toLocaleString('pt-BR'),
            expires_in: '2 minutos',
            site_key: this.siteKeyInput.value.substring(0, 20) + '...'
        };

        this.log('Validação local do token realizada', 'success');
        this.log(`Comprimento do token: ${responseInfo.length} caracteres`, 'info');
        
        this.showMessage('Token ReCAPTCHA validado localmente!', 'success');
    }

    async simulateServerValidation() {
        if (!this.currentResponse) {
            this.showMessage('Nenhuma resposta do ReCAPTCHA para validar', 'error');
            return;
        }

        const secretKey = this.secretKeyInput.value.trim();
        if (!secretKey) {
            this.showMessage('Secret key não fornecida', 'error');
            return;
        }

        this.log('Iniciando simulação de validação no servidor...', 'info');
        this.log(`Usando IP do cliente: ${this.userIP || 'client-ip-unavailable'}`, 'info');
        this.simulateValidationBtn.disabled = true;
        this.simulateValidationBtn.textContent = '🔄 Validando...';

        try {
            // Validar dados antes de enviar
            this.log(`Validando dados de entrada...`, 'info');
            this.log(`Secret Key válida: ${secretKey.length > 30}`, 'info');
            this.log(`Token Response válido: ${this.currentResponse.length > 100}`, 'info');
            
            // Simular chamada para o servidor Google
            const startTime = Date.now();
            this.log(`Iniciando requisição em: ${new Date(startTime).toISOString()}`, 'info');
            
            const response = await this.callGoogleVerifyAPI(secretKey, this.currentResponse);
            const endTime = Date.now();
            
            const duration = endTime - startTime;
            this.log(`Requisição finalizada em: ${new Date(endTime).toISOString()}`, 'info');
            
            if (response) {
                this.log(`Resposta recebida com sucesso`, 'success');
                this.displayServerValidationResult(response, duration);
                this.log(`Validação concluída em ${duration}ms`, 'info');
            } else {
                this.log('Resposta nula ou indefinida recebida', 'error');
                throw new Error('Resposta nula da API');
            }
            
        } catch (error) {
            console.error('Erro na validação:', error);
            this.log(`❌ Erro capturado no simulateServerValidation:`, 'error');
            this.log(`   Tipo: ${error.constructor.name}`, 'error');
            this.log(`   Mensagem: ${error.message}`, 'error');
            this.log(`   Stack: ${error.stack?.substring(0, 200)}...`, 'error');
            
            this.displayServerValidationError(error.message);
        } finally {
            this.simulateValidationBtn.disabled = false;
            this.simulateValidationBtn.textContent = '🔍 Simular Validação do Servidor';
        }
    }

    async callGoogleVerifyAPI(secretKey, response) {
        // Usando backend local Node.js para validação segura
        const backendUrl = 'http://localhost:3001/verify-recaptcha';
        
        const payload = {
            token: response,
            secretKey: secretKey,
            remoteip: this.userIP || 'client-ip-unavailable'
        };

        this.log(`🔄 Usando backend local: ${backendUrl}`, 'info');
        this.log(`Payload: token=${response.substring(0, 20)}..., secretKey=${secretKey.substring(0, 10)}..., remoteip=${this.userIP || 'client-ip-unavailable'}`, 'info');

        try {
            this.log('🚀 Enviando requisição para backend local...', 'info');
            
            // Primeiro, verificar se o backend está ativo
            try {
                this.log('🔍 Verificando se backend está ativo...', 'info');
                const healthResponse = await fetch('http://localhost:3001/health', {
                    method: 'GET',
                    timeout: 3000
                });
                
                if (healthResponse.ok) {
                    const healthData = await healthResponse.json();
                    this.log(`✅ Backend ativo: ${healthData.message} (v${healthData.version})`, 'success');
                } else {
                    throw new Error(`Backend não está saudável: ${healthResponse.status}`);
                }
            } catch (healthError) {
                this.log('❌ Backend não está ativo!', 'error');
                this.log('💡 Execute: cd backend && npm install && npm start', 'warning');
                throw new Error('Backend local não está disponível. Execute o servidor Node.js primeiro.');
            }
            
            // Criar um AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                this.log('Requisição abortada por timeout (15s)', 'warning');
            }, 15000);
            
            // Fazer a requisição para o backend local
            const apiResponse = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            this.log(`📡 Status da resposta do backend: ${apiResponse.status} ${apiResponse.statusText}`, 'info');
            
            // Processar resposta JSON
            let data;
            try {
                data = await apiResponse.json();
                this.log(`📊 Dados recebidos do backend:`, 'info');
                this.log(`   Success: ${data.success}`, data.success ? 'success' : 'error');
                
                if (data.validation_info) {
                    this.log(`   IP Cliente: ${data.validation_info.client_ip}`, 'info');
                    this.log(`   Tempo de resposta: ${data.validation_info.response_time_ms}ms`, 'info');
                    this.log(`   Validado em: ${data.validation_info.validated_at}`, 'info');
                }
                
                if (data.error_codes && data.error_codes.length > 0) {
                    this.log(`   Códigos de erro: ${data.error_codes.join(', ')}`, 'error');
                }
                
            } catch (jsonError) {
                this.log('❌ Erro ao fazer parse do JSON da resposta', 'error');
                throw new Error(`Erro ao processar resposta do backend: ${jsonError.message}`);
            }

            // Se não foi sucesso, mas temos dados estruturados do backend
            if (!apiResponse.ok) {
                const errorMsg = data.error || `Erro HTTP ${apiResponse.status}`;
                this.log(`❌ Backend retornou erro: ${errorMsg}`, 'error');
                
                if (data.error_code) {
                    this.log(`   Código do erro: ${data.error_code}`, 'error');
                }
                
                // Retornar os dados mesmo em caso de erro para processamento
                return data;
            }

            this.log('✅ Validação realizada com sucesso pelo backend!', 'success');
            return data;
            
        } catch (error) {
            // Log detalhado do erro
            this.log(`❌ Tipo do erro: ${error.constructor.name}`, 'error');
            this.log(`❌ Mensagem do erro: ${error.message}`, 'error');
            
            if (error.message.includes('Backend local não está disponível')) {
                this.log('🚫 Backend Node.js não está rodando!', 'error');
                this.log('📋 Para iniciar o backend:', 'info');
                this.log('   1. cd backend', 'info');
                this.log('   2. npm install', 'info');
                this.log('   3. npm start', 'info');
                this.log('🌐 O backend rodará em http://localhost:3001', 'info');
                
                // Retornar resposta indicando que o backend não está disponível
                return {
                    success: false,
                    error_codes: ['BACKEND_UNAVAILABLE'],
                    error: 'Backend local não está disponível',
                    backend_required: true,
                    instructions: [
                        'cd backend',
                        'npm install',
                        'npm start'
                    ]
                };
                
            } else if (error.name === 'AbortError') {
                this.log('⏱️ Timeout na requisição para o backend', 'error');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.log('🌐 Erro de rede ao conectar com backend local', 'error');
                this.log('💡 Verifique se o backend está rodando na porta 3001', 'warning');
            }
            
            // Stack trace para debug
            if (error.stack) {
                console.error('Stack trace completo:', error.stack);
                this.log(`Stack: ${error.stack.split('\n')[1] || 'N/A'}`, 'error');
            }
            
            // Retornar estrutura de erro ao invés de dados simulados
            return {
                success: false,
                error_codes: ['BACKEND_ERROR'],
                error: error.message,
                backend_error: true,
                original_error: error.message
            };
        }
    }

    displayServerValidationResult(data, duration) {
        const isSuccess = data.success;
        const className = isSuccess ? 'validation-success' : 'validation-error';
        
        this.serverValidation.className = `server-validation ${className}`;
        this.serverValidation.innerHTML = `
            <h3>${isSuccess ? '✅ Validação Bem-Sucedida' : '❌ Validação Falhou'}</h3>
            
            <div class="validation-info">
                <span class="validation-label">Status:</span>
                <span class="validation-value">${isSuccess ? 'SUCCESS' : 'FAILED'}</span>
            </div>
            
            <div class="validation-info">
                <span class="validation-label">Tempo de resposta:</span>
                <span class="validation-value">${duration}ms</span>
            </div>
            
            <div class="validation-info">
                <span class="validation-label">Timestamp:</span>
                <span class="validation-value">${data.challenge_ts || 'N/A'}</span>
            </div>
            
            <div class="validation-info">
                <span class="validation-label">Hostname:</span>
                <span class="validation-value">${data.hostname || window.location.hostname}</span>
            </div>
            
            ${data.error_codes && data.error_codes.length > 0 ? `
            <div class="validation-info">
                <span class="validation-label">Códigos de erro:</span>
                <span class="validation-value">${data.error_codes.join(', ')}</span>
            </div>
            ` : ''}
            
            ${data.validation_info ? `
            <div class="validation-info">
                <span class="validation-label">Método:</span>
                <span class="validation-value">✅ BACKEND NODE.JS (Validação Real)</span>
            </div>
            <div class="validation-info">
                <span class="validation-label">IP Cliente:</span>
                <span class="validation-value">${data.validation_info.client_ip}</span>
            </div>
            <div class="validation-info">
                <span class="validation-label">Validado em:</span>
                <span class="validation-value">${new Date(data.validation_info.validated_at).toLocaleString('pt-BR')}</span>
            </div>
            ` : ''}
            
            ${data.backend_required ? `
            <div class="validation-info" style="background: #f8d7da; padding: 8px; border-radius: 4px; margin-top: 8px;">
                <span class="validation-label" style="color: #721c24; font-weight: bold;">� Backend Indisponível:</span>
                <span class="validation-value" style="color: #721c24;">
                    O servidor Node.js local não está rodando.
                </span>
            </div>
            <div class="validation-info" style="background: #d4edda; padding: 8px; border-radius: 4px; margin-top: 4px;">
                <span class="validation-label" style="color: #155724; font-weight: bold;">🚀 Como iniciar:</span>
                <span class="validation-value" style="color: #155724;">
                    <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 2px;">cd backend && npm install && npm start</code>
                </span>
            </div>
            ` : ''}
        `;

        if (isSuccess) {
            this.log('Validação do servidor bem-sucedida!', 'success');
            this.showMessage('Token validado com sucesso no servidor!', 'success');
        } else {
            this.log('Validação do servidor falhou', 'error');
            this.showMessage('Falha na validação do servidor', 'error');
        }
    }

    displayServerValidationError(errorMessage) {
        const isNetworkError = errorMessage.includes('NetworkError') || errorMessage.includes('CORS');
        
        this.serverValidation.className = 'server-validation validation-error';
        this.serverValidation.innerHTML = `
            <h3>❌ Erro na Validação</h3>
            <div class="validation-info">
                <span class="validation-label">Erro:</span>
                <span class="validation-value">${errorMessage}</span>
            </div>
            
            ${isNetworkError ? `
            <div class="validation-info" style="background: #f8d7da; padding: 8px; border-radius: 4px; margin-top: 8px;">
                <span class="validation-label" style="color: #721c24; font-weight: bold;">🚫 Problema CORS:</span>
                <span class="validation-value" style="color: #721c24;">
                    A API do Google ReCAPTCHA não permite requisições diretas do frontend por questões de segurança.
                </span>
            </div>
            <div class="validation-info" style="background: #d4edda; padding: 8px; border-radius: 4px; margin-top: 8px;">
                <span class="validation-label" style="color: #155724; font-weight: bold;">✅ Solução:</span>
                <span class="validation-value" style="color: #155724;">
                    Implemente a validação no seu backend/servidor onde não há restrições CORS.
                    <br><br>
                    <button onclick="window.recaptchaValidator.showBackendExample()" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        📋 Ver Exemplo de Backend
                    </button>
                </span>
            </div>
            ` : `
            <div class="validation-info">
                <span class="validation-label">Sugestão:</span>
                <span class="validation-value">Verifique sua conexão e tente novamente</span>
            </div>
            `}
        `;
        
        this.showMessage(`Erro na validação: ${errorMessage}`, 'error');
    }
    
    showBackendExample() {
        const example = `
// Exemplo Node.js/Express para validar ReCAPTCHA no backend
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

app.post('/verify-recaptcha', async (req, res) => {
    const { token, secretKey } = req.body;
    const userIP = req.ip || req.connection.remoteAddress;
    
    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
                remoteip: userIP
            })
        });
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});`;

        // Criar modal com o exemplo
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); z-index: 1000; display: flex; 
            justify-content: center; align-items: center; padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; width: 100%; max-height: 80%; overflow-y: auto;">
                <h3>📋 Exemplo de Backend - Node.js/Express</h3>
                <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 14px; line-height: 1.4;">${example}</pre>
                <div style="margin-top: 15px; text-align: center;">
                    <button onclick="navigator.clipboard.writeText(\`${example.replace(/`/g, '\\`')}\`).then(() => alert('Código copiado!'))" 
                            style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                        📋 Copiar Código
                    </button>
                    <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        ✕ Fechar
                    </button>
                </div>
                <p style="margin-top: 15px; font-size: 12px; color: #666;">
                    <strong>Importante:</strong> Instale as dependências com <code>npm install express node-fetch</code>
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        this.log('Exemplo de backend exibido', 'info');
    }

    resetRecaptcha() {
        if (this.widgetId !== null && typeof grecaptcha !== 'undefined') {
            try {
                grecaptcha.reset(this.widgetId);
                this.log('ReCAPTCHA resetado', 'info');
            } catch (error) {
                console.error('Erro ao resetar ReCAPTCHA:', error);
                this.log(`Erro ao resetar: ${error.message}`, 'error');
            }
        }
        
        this.currentResponse = null;
        this.responseOutput.value = '';
        this.validateBtn.disabled = true;
        this.copyResponseBtn.disabled = true;
        this.simulateValidationBtn.disabled = true;
        
        this.resetServerValidation();
    }

    resetServerValidation() {
        this.serverValidation.className = 'server-validation';
        this.serverValidation.innerHTML = '<p>Nenhuma validação realizada ainda</p>';
    }

    reconfigureRecaptcha() {
        if (this.widgetId !== null) {
            this.log('Reconfigurando ReCAPTCHA...', 'info');
            this.resetRecaptcha();
            setTimeout(() => {
                this.renderRecaptcha();
            }, 500);
        }
    }

    debounceReconfiguration() {
        clearTimeout(this.reconfigTimeout);
        this.reconfigTimeout = setTimeout(() => {
            this.reconfigureRecaptcha();
        }, 1000);
    }

    async copyResponse() {
        if (!this.currentResponse) return;

        try {
            await navigator.clipboard.writeText(this.currentResponse);
            this.showMessage('Resposta copiada para a área de transferência!', 'success');
            this.log('Token copiado para clipboard', 'info');
            
            const originalText = this.copyResponseBtn.textContent;
            this.copyResponseBtn.textContent = '✅ Copiado!';
            setTimeout(() => {
                this.copyResponseBtn.textContent = originalText;
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao copiar:', error);
            this.showMessage('Falha ao copiar resposta', 'error');
            this.log('Falha ao copiar para clipboard', 'error');
        }
    }

    showRecaptchaError(message) {
        this.recaptchaContainer.innerHTML = `
            <div class="recaptcha-error">
                <p style="color: #f44336;">❌ ${message}</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Recarregar Página
                </button>
            </div>
        `;
    }

    showMessage(text, type) {
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = `message ${type} show`;
        message.textContent = text;

        const main = document.querySelector('main');
        main.insertBefore(message, main.firstChild);

        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const logEntry = document.createElement('p');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        this.logsContainer.appendChild(logEntry);
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
        
        // Manter apenas os últimos 50 logs
        const logs = this.logsContainer.querySelectorAll('.log-entry');
        if (logs.length > 50) {
            logs[0].remove();
        }
    }

    clearLogs() {
        this.logsContainer.innerHTML = '<p class="log-entry">Logs limpos - sistema pronto</p>';
    }
}

// Funções utilitárias
function validateSiteKeyV2(siteKey) {
    const siteKeyPattern = /^6[A-Za-z0-9_-]{39}$/;
    return siteKeyPattern.test(siteKey);
}

function validateSecretKey(secretKey) {
    const secretKeyPattern = /^6[A-Za-z0-9_-]{39}$/;
    return secretKeyPattern.test(secretKey);
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.recaptchaValidator = new ReCAPTCHAv2Validator();
    
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R para resetar
        if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('resetBtn').click();
        }
        
        // Ctrl/Cmd + Enter para validar
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const validateBtn = document.getElementById('validateBtn');
            if (!validateBtn.disabled) {
                validateBtn.click();
            }
        }
    });
});



// Informações de debug no console
console.log('%c🛡️ ReCAPTCHA v2 Validator', 'color: #2196f3; font-size: 20px; font-weight: bold;');
console.log('Atalhos de teclado:');
console.log('• Ctrl/Cmd + R: Resetar ReCAPTCHA');
console.log('• Ctrl/Cmd + Enter: Validar resposta');
console.log('\nSubstitua pelas suas chaves reais: https://www.google.com/recaptcha/admin');
