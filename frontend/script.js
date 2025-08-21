class ReCAPTCHAGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentToken = null;
    }

    initializeElements() {
        this.siteKeyInput = document.getElementById('siteKey');
        this.actionInput = document.getElementById('action');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.tokenOutput = document.getElementById('tokenOutput');
        this.tokenInfo = document.getElementById('tokenInfo');
        this.loading = document.getElementById('loading');
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateToken());
        this.copyBtn.addEventListener('click', () => this.copyToken());
        this.siteKeyInput.addEventListener('input', () => this.reloadRecaptcha());
    }

    async reloadRecaptcha() {
        const siteKey = this.siteKeyInput.value.trim();
        if (!siteKey) return;

        try {
            // Remove existing recaptcha script
            const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
            if (existingScript) {
                existingScript.remove();
            }

            // Add new script with updated site key
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.onload = () => {
                this.showMessage('ReCAPTCHA loaded successfully!', 'success');
            };
            script.onerror = () => {
                this.showMessage('Failed to load ReCAPTCHA. Please check your site key.', 'error');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error reloading ReCAPTCHA:', error);
            this.showMessage('Error reloading ReCAPTCHA', 'error');
        }
    }

    async generateToken() {
        const siteKey = this.siteKeyInput.value.trim();
        const action = this.actionInput.value.trim() || 'submit';

        if (!siteKey) {
            this.showMessage('Please enter a site key', 'error');
            return;
        }

        // Show loading state
        this.showLoading(true);
        this.generateBtn.disabled = true;

        try {
            // Wait for grecaptcha to be ready
            await this.waitForRecaptcha();

            const startTime = Date.now();
            
            // Generate the token
            const token = await grecaptcha.execute(siteKey, { action: action });
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            this.currentToken = token;
            this.displayToken(token, action, duration);
            this.showMessage('Token generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating token:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
            this.tokenOutput.value = '';
            this.tokenInfo.innerHTML = '<p>Failed to generate token</p>';
        } finally {
            this.showLoading(false);
            this.generateBtn.disabled = false;
        }
    }

    waitForRecaptcha() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait time
            
            const checkRecaptcha = () => {
                attempts++;
                
                if (typeof grecaptcha !== 'undefined' && grecaptcha.execute) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('ReCAPTCHA failed to load. Please check your site key and internet connection.'));
                } else {
                    setTimeout(checkRecaptcha, 100);
                }
            };
            
            checkRecaptcha();
        });
    }

    displayToken(token, action, duration) {
        // Display the token
        this.tokenOutput.value = token;
        this.copyBtn.disabled = false;

        // Decode token information
        const tokenInfo = this.decodeToken(token);
        
        // Display token information
        this.tokenInfo.innerHTML = `
            <div class="info-item">
                <span class="info-label">Action:</span>
                <span class="info-value">${action}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Generated at:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Generation time:</span>
                <span class="info-value">${duration}ms</span>
            </div>
            <div class="info-item">
                <span class="info-label">Token length:</span>
                <span class="info-value">${token.length} characters</span>
            </div>
            <div class="info-item">
                <span class="info-label">Token prefix:</span>
                <span class="info-value">${token.substring(0, 20)}...</span>
            </div>
            <div class="info-item">
                <span class="info-label">Valid for:</span>
                <span class="info-value">~2 minutes</span>
            </div>
        `;
    }

    decodeToken(token) {
        // Note: ReCAPTCHA v3 tokens are encoded and cannot be easily decoded client-side
        // This is just for display purposes
        return {
            length: token.length,
            prefix: token.substring(0, 20),
            timestamp: new Date().toISOString()
        };
    }

    async copyToken() {
        if (!this.currentToken) return;

        try {
            await navigator.clipboard.writeText(this.currentToken);
            this.showMessage('Token copied to clipboard!', 'success');
            
            // Visual feedback
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showMessage('Failed to copy token', 'error');
        }
    }

    showLoading(show) {
        if (show) {
            this.loading.classList.remove('hidden');
        } else {
            this.loading.classList.add('hidden');
        }
    }

    showMessage(text, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        message.classList.add('show');

        // Insert message at the top of the main content
        const main = document.querySelector('main');
        main.insertBefore(message, main.firstChild);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }
}

// Utility functions
function validateSiteKey(siteKey) {
    // Basic validation for ReCAPTCHA site key format
    const siteKeyPattern = /^6[A-Za-z0-9_-]{39}$/;
    return siteKeyPattern.test(siteKey);
}

function generateRandomAction() {
    const actions = ['submit', 'login', 'register', 'contact', 'purchase', 'subscribe', 'download'];
    return actions[Math.floor(Math.random() * actions.length)];
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReCAPTCHAGenerator();
    
    // Add some helpful keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to generate token
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('generateBtn').click();
        }
        
        // Ctrl/Cmd + C when token output is focused to copy
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement === document.getElementById('tokenOutput')) {
            document.getElementById('copyBtn').click();
        }
    });
});

// Add some console information for developers
console.log('%c🔐 ReCAPTCHA v3 Key Generator', 'color: #5a67d8; font-size: 20px; font-weight: bold;');
console.log('Keyboard shortcuts:');
console.log('• Ctrl/Cmd + Enter: Generate token');
console.log('• Ctrl/Cmd + C (when token is selected): Copy token');
console.log('\nTest site key included: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
console.log('Replace with your actual site key from: https://www.google.com/recaptcha/admin');
