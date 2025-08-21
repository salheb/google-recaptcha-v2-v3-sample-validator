# AVISO IMPORTANTE

> **Este repositório foi inteiramente criado com o auxílio de Inteligências Artificiais (IA) e está sendo disponibilizado publicamente para auxiliar outras pessoas com o mesmo caso de uso. Sinta-se à vontade para utilizar, adaptar e compartilhar!**

# Google ReCAPTCHA Generator & Validator

Um toolkit frontend completo para trabalhar com Google ReCAPTCHA v2 e v3. Esta aplicação fornece ferramentas para gerar tokens v3 e validar respostas v2, ajudando desenvolvedores a integrar e testar ambas as versões do ReCAPTCHA.

## Funcionalidades

### ReCAPTCHA v3 Generator (index.html)
- 🔑 Gere tokens do ReCAPTCHA v3 com ações personalizadas
- 📋 Copie tokens para a área de transferência com um clique
- ⏱️ Veja o tempo de geração do token e metadados
- 🎨 UI moderna e responsiva com animações suaves
- 🔄 Atualização de configuração do ReCAPTCHA em tempo real
- ⌨️ Atalhos de teclado para maior produtividade

### ReCAPTCHA v2 Validator (recaptcha-v2.html)
- 🛡️ Renderização interativa do desafio ReCAPTCHA v2
- ✅ Validação programática do token
- 🔍 Simulação de validação no backend
- 🎛️ Opções de tema e tamanho customizáveis
- 📊 Análise detalhada da resposta de validação
- 📝 Sistema de logs em tempo real
- 💻 Exemplos completos de implementação

### Funcionalidades Comuns
- 📚 Instruções de configuração embutidas para ambas as versões
- 🔗 Navegação fácil entre as ferramentas v2 e v3
- 📱 Design totalmente responsivo
- 🚀 Não requer processo de build

## Início Rápido

### ReCAPTCHA v3 (Geração de Token)
1. Abra o `index.html` no seu navegador
2. O app já vem pré-configurado com as chaves de teste do Google
3. Clique em "Generate ReCAPTCHA Token" para criar um token
4. Copie o token gerado usando o botão de copiar

### ReCAPTCHA v2 (Validação Interativa)
1. Abra o `recaptcha-v2.html` no seu navegador
2. Complete o desafio do ReCAPTCHA (checkbox/imagens)
3. Clique em "Validate ReCAPTCHA" para checar a resposta
4. Use "Simulate Server Validation" para testar a verificação no backend

## Usando Suas Próprias Chaves

1. Acesse o [Google ReCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Crie um novo site e selecione "reCAPTCHA v3"
3. Adicione seu(s) domínio(s) à lista de domínios permitidos
4. Copie sua Site Key do painel de administração
5. Substitua a chave de teste pelo seu Site Key no app
6. Gere seu primeiro token!

## Estrutura de Arquivos

```
recaptcha-test/
├── index.html          # Gerador de Token ReCAPTCHA v3
├── recaptcha-v2.html   # Validador ReCAPTCHA v2
├── styles.css          # CSS para o gerador v3
├── styles-v2.css       # CSS para o validador v2
├── script.js           # JavaScript para funcionalidade v3
├── script-v2.js        # JavaScript para funcionalidade v2
├── package.json        # Configuração do projeto
└── README.md           # Esta documentação
```

## Como o ReCAPTCHA Funciona

### ReCAPTCHA v2
- **Interativo**: Usuários resolvem desafios (checkbox, seleção de imagens)
- **Resultado binário**: Validação passa/falha
- **Iniciado pelo usuário**: Disparado por interação do usuário
- **Widget visível**: Exibe um checkbox ou UI de desafio

### ReCAPTCHA v3
- **Invisível**: Não há checkbox ou quebra-cabeça para resolver
- **Baseado em score**: Retorna um score (0.0 - 1.0) indicando a probabilidade de ser humano
- **Baseado em ação**: Você pode especificar ações customizadas para ajudar o Google a entender o contexto
- **Contínuo**: Pode ser chamado múltiplas vezes na mesma página

## Informações do Token

Os tokens gerados contêm:
- **Ação**: Nome da ação customizada especificada
- **Timestamp**: Quando o token foi gerado
- **Verificação do site**: Valida que o token foi gerado para seu site
- **Score**: Score de risco (visível apenas na verificação server-side)

## Exemplo de Uso da API

Depois de obter um token, faça a verificação no seu backend:

```javascript
// Frontend - Gerar token
const token = await grecaptcha.execute('YOUR_SITE_KEY', {action: 'submit'});

// Backend - Verificar token
const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `secret=YOUR_SECRET_KEY&response=${token}`
});

const result = await response.json();
console.log('Score:', result.score); // 0.0 - 1.0
console.log('Action:', result.action); // deve bater com sua action
```

## Atalhos de Teclado

### ReCAPTCHA v3 Generator
- `Ctrl/Cmd + Enter`: Gerar novo token
- `Ctrl/Cmd + C` (quando o token está selecionado): Copiar token para a área de transferência

### ReCAPTCHA v2 Validator
- `Ctrl/Cmd + R`: Resetar o ReCAPTCHA
- `Ctrl/Cmd + Enter`: Validar resposta (se disponível)

## Compatibilidade de Navegador

- Navegadores modernos com suporte a ES6+
- Chrome, Firefox, Safari, Edge
- Requer JavaScript habilitado

## Notas de Segurança

- ⚠️ Nunca exponha sua Secret Key no código frontend
- ✅ Sempre valide os tokens no seu servidor
- ✅ Defina thresholds de score apropriados (tipicamente 0.5)
- ✅ Use nomes de ação significativos
- ✅ Implemente rate limiting no seu backend

## Solução de Problemas

**Falha ao gerar token:**
- Verifique se sua site key é válida
- Certifique-se de que seu domínio está adicionado no painel do ReCAPTCHA
- Veja o console do navegador para erros

**Erro "ReCAPTCHA failed to load":**
- Verifique sua conexão com a internet
- Cheque se o formato da sua site key está correto (começa com "6L")
- Certifique-se de que o script do ReCAPTCHA está carregando corretamente

## Desenvolvimento

Agora você pode iniciar tanto o backend quanto o frontend automaticamente com um único comando!

### Iniciar ambos os servidores (frontend e backend)

1. Certifique-se de estar na pasta raiz do projeto
2. Execute o script abaixo:

```bash
./start.sh
```

- O backend será iniciado na porta **3001**
- O frontend será servido na porta **8080**
- Acesse o frontend em: [http://localhost:8080](http://localhost:8080)
- O backend estará disponível em: [http://localhost:3001](http://localhost:3001)

Para parar ambos os servidores, basta pressionar `Ctrl+C` no terminal.

### Alternativa manual (caso prefira)

Você ainda pode servir o frontend manualmente com um servidor HTTP simples:

```bash
# Python 3
python -m http.server 8080

# Node.js (se tiver http-server instalado)
npx http-server -p 8080

# PHP
php -S localhost:8080
```

## Contribuindo

Sinta-se à vontade para abrir issues, sugestões ou pull requests para melhorar esta ferramenta!

## Licença

Este projeto é open source e está disponível sob a licença MIT.
