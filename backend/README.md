# ReCAPTCHA Validation Backend

Backend Node.js para validação de tokens ReCAPTCHA v2.

## 🚀 Instalação e Execução

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Executar o servidor
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

O servidor iniciará na porta `3001` por padrão.

## 📡 Endpoints

### Health Check
```http
GET /health
```

Resposta:
```json
{
    "status": "OK",
    "message": "ReCAPTCHA Validation Backend is running",
    "timestamp": "2024-08-21T14:30:45.123Z",
    "version": "1.0.0"
}
```

### Validar ReCAPTCHA
```http
POST /verify-recaptcha
Content-Type: application/json
```

Body:
```json
{
    "token": "03AGdBq25...",
    "secretKey": "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
    "remoteip": "192.168.1.100"
}
```

Resposta (Sucesso):
```json
{
    "success": true,
    "challenge_ts": "2024-08-21T14:30:45Z",
    "hostname": "localhost",
    "error_codes": [],
    "validation_info": {
        "client_ip": "192.168.1.100",
        "response_time_ms": 245,
        "validated_at": "2024-08-21T14:30:45.123Z",
        "backend_version": "1.0.0"
    }
}
```

## 🛡️ Características

- ✅ Validação completa de tokens ReCAPTCHA
- 🌐 CORS habilitado para desenvolvimento
- 📊 Logs detalhados de requisições
- ⏱️ Timeout de 10 segundos nas requisições
- 🚀 Informações de performance (tempo de resposta)
- 🔍 Tratamento robusto de erros
- 💡 Responses informativos com códigos de erro

## 🔧 Configuração

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3001)
- `NODE_ENV`: Ambiente (development/production)

### Exemplo de uso com curl
```bash
curl -X POST http://localhost:3001/verify-recaptcha \
  -H "Content-Type: application/json" \
  -d '{
    "token": "03AGdBq25...",
    "secretKey": "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
    "remoteip": "192.168.1.100"
  }'
```

## 📝 Logs

O servidor produz logs estruturados:
```
[2024-08-21T14:30:45.123Z] POST /verify-recaptcha - IP: ::1
Validando ReCAPTCHA para IP: 192.168.1.100
Token: 03AGdBq25...
Secret Key: 6LeIxAcTAA...
Resposta da API Google (245ms): {
  "success": true,
  "challenge_ts": "2024-08-21T14:30:45Z",
  "hostname": "localhost"
}
```
