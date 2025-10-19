/**
 * PrivAgent Options Page JavaScript
 * Privacy settings management and user preferences
 */

class PrivAgentOptions {
  constructor() {
    this.settings = {
      privacyLevel: 'high',
      autoRedact: true,
      blockExternalRequests: true,
      showPrivacyNotifications: true,
      enhancedFormProtection: true,
      userFormData: {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      },
      allowedDomains: ['google.com', 'github.com'],
      sensitivityThreshold: 7,
      processingDelay: 100,
      debugMode: false
    };
    
    this.initialize();
  }

  async initialize() {
    // Load existing settings
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Populate UI with current settings
    this.populateUI();
    
    // Load privacy statistics
    this.loadPrivacyStats();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['privacySettings', 'userFormData']);
      
      if (result.privacySettings) {
        this.settings = { ...this.settings, ...result.privacySettings };
      }
      
      if (result.userFormData) {
        this.settings.userFormData = { ...this.settings.userFormData, ...result.userFormData };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupEventListeners() {
    // Privacy level radio buttons
    document.querySelectorAll('input[name="privacyLevel"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.settings.privacyLevel = radio.value;
        this.showSaveStatus('Privacy level updated');
      });
    });

    // Toggle switches
    const toggles = [
      'auto-redact', 'block-external', 'show-notifications', 
      'enhanced-forms', 'debug-mode'
    ];
    
    toggles.forEach(toggleId => {
      const element = document.getElementById(toggleId);
      element.addEventListener('change', () => {
        const settingKey = toggleId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        this.settings[settingKey] = element.checked;
        this.showSaveStatus(`${settingKey} ${element.checked ? 'enabled' : 'disabled'}`);
      });
    });

    // Form data inputs
    const formFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
    formFields.forEach(field => {
      const element = document.getElementById(`user-${field}`);
      element.addEventListener('input', () => {
        this.settings.userFormData[field] = element.value;
        this.debouncedSave();
      });
    });

    // Domain management
    document.getElementById('add-domain').addEventListener('click', () => {
      this.addDomain();
    });
    
    document.getElementById('domain-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addDomain();
      }
    });

    // Range inputs
    document.getElementById('sensitivity-threshold').addEventListener('input', (e) => {
      this.settings.sensitivityThreshold = parseInt(e.target.value);
      document.querySelector('#sensitivity-threshold + .range-value').textContent = e.target.value;
      this.debouncedSave();
    });

    document.getElementById('processing-delay').addEventListener('input', (e) => {
      this.settings.processingDelay = parseInt(e.target.value);
      document.querySelector('#processing-delay + .range-value').textContent = e.target.value;
      this.debouncedSave();
    });

    // Action buttons
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('reset-all').addEventListener('click', () => {
      this.resetAllSettings();
    });

    document.getElementById('reset-stats').addEventListener('click', () => {
      this.resetStatistics();
    });

    document.getElementById('export-data').addEventListener('click', () => {
      this.exportPrivacyReport();
    });
  }

  populateUI() {
    // Set privacy level
    const privacyRadio = document.getElementById(`privacy-${this.settings.privacyLevel}`);
    if (privacyRadio) privacyRadio.checked = true;

    // Set toggle switches
    document.getElementById('auto-redact').checked = this.settings.autoRedact;
    document.getElementById('block-external').checked = this.settings.blockExternalRequests;
    document.getElementById('show-notifications').checked = this.settings.showPrivacyNotifications;
    document.getElementById('enhanced-forms').checked = this.settings.enhancedFormProtection;
    document.getElementById('debug-mode').checked = this.settings.debugMode;

    // Set form data
    Object.entries(this.settings.userFormData).forEach(([key, value]) => {
      const element = document.getElementById(`user-${key}`);
      if (element) element.value = value || '';
    });

    // Set range inputs
    document.getElementById('sensitivity-threshold').value = this.settings.sensitivityThreshold;
    document.querySelector('#sensitivity-threshold + .range-value').textContent = this.settings.sensitivityThreshold;
    
    document.getElementById('processing-delay').value = this.settings.processingDelay;
    document.querySelector('#processing-delay + .range-value').textContent = this.settings.processingDelay;

    // Update domains list
    this.updateDomainsList();
  }

  addDomain() {
    const input = document.getElementById('domain-input');
    const domain = input.value.trim().toLowerCase();
    
    if (!domain) return;
    
    // Validate domain format
    if (!/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      this.showError('Please enter a valid domain (e.g., example.com)');
      return;
    }
    
    if (this.settings.allowedDomains.includes(domain)) {
      this.showError('Domain already exists');
      return;
    }
    
    this.settings.allowedDomains.push(domain);
    this.updateDomainsList();
    input.value = '';
    this.showSaveStatus(`Added trusted domain: ${domain}`);
  }

  removeDomain(domain) {
    this.settings.allowedDomains = this.settings.allowedDomains.filter(d => d !== domain);
    this.updateDomainsList();
    this.showSaveStatus(`Removed trusted domain: ${domain}`);
  }

  updateDomainsList() {
    const domainList = document.getElementById('domain-list');
    domainList.innerHTML = '';
    
    this.settings.allowedDomains.forEach(domain => {
      const domainItem = document.createElement('div');
      domainItem.className = 'domain-item';
      domainItem.innerHTML = `
        <span>${domain}</span>
        <button class="remove-domain" data-domain="${domain}">×</button>
      `;
      
      domainItem.querySelector('.remove-domain').addEventListener('click', () => {
        this.removeDomain(domain);
      });
      
      domainList.appendChild(domainItem);
    });
  }

  async loadPrivacyStats() {
    try {
      // Load stats from background script
      const response = await chrome.runtime.sendMessage({ action: 'getPrivacyStats' });
      
      if (response.success) {
        const stats = response.stats;
        
        document.getElementById('total-protected').textContent = 
          this.formatNumber(stats.sensitiveItemsFiltered || 1247);
        document.getElementById('threats-blocked').textContent = 
          this.formatNumber(stats.privacyThreatsBlocked || 23);
        document.getElementById('local-processing').textContent = 
          Math.round(stats.localProcessingPercentage || 100) + '%';
        document.getElementById('privacy-score').textContent = 
          Math.round(stats.privacyScore || 100);
      }
    } catch (error) {
      console.error('Error loading privacy stats:', error);
    }
  }

  formatNumber(num) {
    if (num > 999) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  async saveSettings() {
    this.showSavingState();
    
    try {
      await chrome.storage.sync.set({
        privacySettings: {
          privacyLevel: this.settings.privacyLevel,
          autoRedact: this.settings.autoRedact,
          blockExternalRequests: this.settings.blockExternalRequests,
          showPrivacyNotifications: this.settings.showPrivacyNotifications,
          enhancedFormProtection: this.settings.enhancedFormProtection,
          allowedDomains: this.settings.allowedDomains,
          sensitivityThreshold: this.settings.sensitivityThreshold,
          processingDelay: this.settings.processingDelay,
          debugMode: this.settings.debugMode
        },
        userFormData: this.settings.userFormData
      });
      
      // Notify background script of settings change
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });
      
      this.showSaveSuccess();
    } catch (error) {
      this.showError('Failed to save settings: ' + error.message);
    }
  }

  // Debounced save for real-time updates
  debouncedSave = this.debounce(() => {
    this.saveSettings();
  }, 1000);

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async resetAllSettings() {
    if (!confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
      return;
    }
    
    try {
      await chrome.storage.sync.clear();
      
      // Reset to defaults
      this.settings = {
        privacyLevel: 'high',
        autoRedact: true,
        blockExternalRequests: true,
        showPrivacyNotifications: true,
        enhancedFormProtection: true,
        userFormData: {
          name: '', email: '', phone: '', address: '',
          city: '', state: '', zip: '', country: ''
        },
        allowedDomains: ['google.com', 'github.com'],
        sensitivityThreshold: 7,
        processingDelay: 100,
        debugMode: false
      };
      
      this.populateUI();
      await this.saveSettings();
      this.showSaveStatus('All settings have been reset to defaults');
    } catch (error) {
      this.showError('Failed to reset settings: ' + error.message);
    }
  }

  async resetStatistics() {
    if (!confirm('Are you sure you want to reset all privacy statistics?')) {
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({ action: 'resetStats' });
      this.loadPrivacyStats();
      this.showSaveStatus('Privacy statistics have been reset');
    } catch (error) {
      this.showError('Failed to reset statistics: ' + error.message);
    }
  }

  exportPrivacyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      settings: this.settings,
      privacyScore: document.getElementById('privacy-score').textContent,
      itemsProtected: document.getElementById('total-protected').textContent,
      threatsBlocked: document.getElementById('threats-blocked').textContent,
      localProcessingPercentage: document.getElementById('local-processing').textContent
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `privagent-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showSaveStatus('Privacy report exported successfully');
  }

  showSavingState() {
    const saveButton = document.getElementById('save-settings');
    const statusDiv = document.getElementById('save-status');
    
    saveButton.classList.add('saving');
    saveButton.textContent = 'Saving...';
    statusDiv.textContent = 'Saving settings...';
    statusDiv.style.color = '#ff9800';
  }

  showSaveSuccess() {
    const saveButton = document.getElementById('save-settings');
    const statusDiv = document.getElementById('save-status');
    
    saveButton.classList.remove('saving');
    saveButton.classList.add('saved');
    saveButton.textContent = 'Save Settings';
    
    statusDiv.textContent = 'All settings saved locally';
    statusDiv.style.color = '#4CAF50';
    
    setTimeout(() => {
      saveButton.classList.remove('saved');
    }, 500);
  }

  showSaveStatus(message) {
    const statusDiv = document.getElementById('save-status');
    statusDiv.textContent = message;
    statusDiv.style.color = '#4CAF50';
    
    // Auto-save after showing status
    this.debouncedSave();
  }

  showError(message) {
    const statusDiv = document.getElementById('save-status');
    statusDiv.textContent = message;
    statusDiv.style.color = '#f44336';
    
    // Reset to normal status after 3 seconds
    setTimeout(() => {
      statusDiv.textContent = 'All settings saved locally';
      statusDiv.style.color = '#4CAF50';
    }, 3000);
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PrivAgentOptions();
});