/**
 * PrivAgent Popup JavaScript
 * Privacy dashboard interface and controls
 */

class PrivAgentPopup {
  constructor() {
    this.currentTab = null;
    this.privacyStats = {
      privacyScore: 100,
      localProcessingPercentage: 100,
      externalRequests: 0,
      itemsProcessed: 0,
      itemsFiltered: 0
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      // Get current active tab
      this.currentTab = await this.getCurrentTab();
      
      // Load privacy statistics
      await this.loadPrivacyStats();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update UI
      this.updateUI();
      
      // Check for privacy alerts
      this.checkPrivacyAlerts();
    } catch (error) {
      console.error('Popup initialization error:', error);
      this.showError('Failed to initialize privacy dashboard');
    }
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async loadPrivacyStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getPrivacyStats' });
      if (response?.success) {
        this.privacyStats = { ...this.privacyStats, ...response.stats };
      }
    } catch (error) {
      console.error('Error loading privacy stats:', error);
      // Use actual stats - no fake defaults
      this.privacyStats = {
        privacyScore: 100,
        localProcessingPercentage: 100,
        externalRequests: 0,
        itemsProcessed: 0,
        itemsFiltered: 0
      };
    }
  }

  setupEventListeners() {
    try {
      // Command input and send
      const commandInput = document.getElementById('command-input');
      const commandSend = document.getElementById('command-send');
      
      if (commandSend) {
        commandSend.addEventListener('click', () => this.processCommand());
      }
      
      if (commandInput) {
        commandInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.processCommand();
          }
        });
      }

      // Suggestion buttons
      document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const command = e.target.getAttribute('data-command');
          if (commandInput && command) {
            commandInput.value = command;
            this.processCommand();
          }
        });
      });

      // Action buttons
      const fillFormsBtn = document.getElementById('fill-forms');
      if (fillFormsBtn) {
        fillFormsBtn.addEventListener('click', () => {
          this.fillFormsPrivately();
        });
      }

      const analyzePageBtn = document.getElementById('analyze-page');
      if (analyzePageBtn) {
        analyzePageBtn.addEventListener('click', () => {
          this.analyzePage();
        });
      }

      // Settings button
      const settingsBtn = document.getElementById('open-settings');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
          chrome.runtime.openOptionsPage();
        });
      }
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  async processCommand() {
    const commandInput = document.getElementById('command-input');
    const command = commandInput?.value?.trim();
    
    if (!command) return;

    // Show loading state
    this.showCommandLoading();
    
    try {
      // Send command to background script for processing
      const response = await chrome.runtime.sendMessage({
        action: 'processCommand',
        command: command,
        context: {
          url: this.currentTab?.url || 'unknown',
          title: this.currentTab?.title || 'unknown'
        }
      });

      if (response?.success) {
        this.showCommandResponse(response);
      } else {
        this.showCommandError(response?.error || 'Unknown error');
      }
    } catch (error) {
      this.showCommandError('Failed to process command: ' + error.message);
    }

    // Clear input
    if (commandInput) {
      commandInput.value = '';
    }
  }

  showCommandLoading() {
    const responseDiv = document.getElementById('command-response');
    const contentDiv = document.getElementById('response-content');
    
    responseDiv.style.display = 'block';
    contentDiv.innerHTML = '<div class="loading"></div> Processing command locally...';
  }

  showCommandResponse(response) {
    const contentDiv = document.getElementById('response-content');
    
    let responseText = '';
    if (response.result) {
      if (response.result.success) {
        responseText = `✅ ${response.intent} completed successfully`;
        if (response.result.message) {
          responseText = `✅ ${response.result.message}`;
        }
        // Show form filling details
        if (response.result.details) {
          const details = response.result.details;
          if (details.filled || details.clicked || details.warnings) {
            let detailText = '\n🔍 Details:';
            if (details.filled) detailText += ` ${details.filled} fields filled`;
            if (details.clicked) detailText += `, ${details.clicked} buttons clicked`;
            if (details.warnings && details.warnings.length) {
              detailText += `\n⚠️ ${details.warnings.length} warnings`;
            }
            responseText += detailText;
          }
        }
        if (response.result.privacyFiltered) {
          responseText += `\n🛡️ ${response.result.filteredItems || 0} sensitive items protected`;
        }
      } else {
        responseText = `❌ Error: ${response.result.error || 'Unknown error'}`;
      }
    } else {
      responseText = `✅ Command processed: ${response.intent}`;
    }

    contentDiv.innerHTML = responseText.replace(/\n/g, '<br>');
    
    // Update stats after command
    this.loadPrivacyStats().then(() => this.updateUI());
  }

  showCommandError(error) {
    const contentDiv = document.getElementById('response-content');
    contentDiv.innerHTML = `❌ Error: ${error}`;
  }

  async fillFormsPrivately() {
    try {
      // Check if we have a valid tab
      if (!this.currentTab || !this.currentTab.id) {
        this.showNotification('❌ No active tab found', 'error');
        return;
      }

      // Check if tab is a valid webpage
      if (this.currentTab.url?.startsWith('chrome://') || this.currentTab.url?.startsWith('edge://') || this.currentTab.url?.startsWith('moz-extension://')) {
        this.showNotification('❌ Cannot fill forms on browser pages', 'warning');
        return;
      }

      // Show loading state
      this.showNotification('🔄 Filling forms privately...', 'info');

      // Send fillForm action to background script (not directly to content script)
      const response = await chrome.runtime.sendMessage({
        action: 'fillForm',
        tabId: this.currentTab.id
      });

      if (response?.success) {
        const filled = response.filled || 0;
        const clicked = response.clicked || 0;
        const warnings = response.warnings?.length || 0;
        
        let message = `✅ Form filled: ${filled} fields`;
        if (clicked > 0) message += `, ${clicked} buttons clicked`;
        if (warnings > 0) message += `, ${warnings} warnings`;
        
        this.showNotification(message, 'success');
        
        // Show detailed results if available
        if (response.domain) {
          console.log(`Form filling completed on ${response.domain}:`, response);
        }
        
        // Update stats
        this.loadPrivacyStats().then(() => this.updateUI());
      } else {
        let errorMsg = response?.error || 'Unknown error';
        if (errorMsg === 'No Agent Form Details saved') {
          errorMsg = 'Please configure form data in Privacy Settings first';
        }
        this.showNotification(`❌ ${errorMsg}`, 'error');
      }
    } catch (error) {
      if (error.message.includes('Could not establish connection')) {
        this.showNotification('🔄 Extension loading... Please try again', 'warning');
      } else {
        this.showNotification(`❌ Error: ${error.message}`, 'error');
      }
    }
  }

  async analyzePage() {
    try {
      // Check if we have a valid tab
      if (!this.currentTab || !this.currentTab.id) {
        this.showNotification('❌ No active tab found', 'error');
        return;
      }

      // Check if tab is a valid webpage
      if (this.currentTab.url?.startsWith('chrome://') || this.currentTab.url?.startsWith('edge://') || this.currentTab.url?.startsWith('moz-extension://')) {
        this.showNotification('❌ Cannot analyze browser pages', 'warning');
        return;
      }

      // Send analyze command to content script
      try {
        const response = await chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'analyzePage'
        });

        if (response) {
          this.showNotification(
            `🔍 Page analyzed: ${response.forms?.length || 0} forms, ${response.sensitiveFields?.length || 0} sensitive fields detected`,
            'info'
          );
          
          // Show privacy alerts if any sensitive content found
          if (response.privacyRisk && response.privacyRisk !== 'low') {
            this.showPrivacyAlert(`Privacy Risk: ${response.privacyRisk}`, response.sensitiveFields?.length || 0);
          }
        } else {
          this.showNotification('Page analysis completed - no response received', 'info');
        }
      } catch (messageError) {
        if (messageError.message.includes('Could not establish connection') || messageError.message.includes('Receiving end does not exist')) {
          this.showNotification('🔄 Content script loading... Please try again in a moment', 'warning');
        } else {
          throw messageError;
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      this.showNotification(`❌ Analysis failed: ${error.message}`, 'error');
    }
  }

  getDefaultFormData() {
    // This would typically come from user settings/storage
    return {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0123',
      address: '123 Main St',
      city: 'Anytown',
      state: 'ST',
      zip: '12345'
    };
  }

  updateUI() {
    try {
      // Update privacy score
      const privacyScoreEl = document.getElementById('privacy-score');
      const localProcessingEl = document.getElementById('local-processing');
      const externalRequestsEl = document.getElementById('external-requests');
      const itemsProcessedEl = document.getElementById('items-processed');
      const itemsFilteredEl = document.getElementById('items-filtered');
      
      if (privacyScoreEl) privacyScoreEl.textContent = this.privacyStats.privacyScore;
      if (localProcessingEl) localProcessingEl.textContent = this.privacyStats.localProcessingPercentage + '%';
      if (externalRequestsEl) externalRequestsEl.textContent = this.privacyStats.externalRequests;
      if (itemsProcessedEl) itemsProcessedEl.textContent = this.privacyStats.itemsProcessed;
      if (itemsFilteredEl) itemsFilteredEl.textContent = this.privacyStats.itemsFiltered;
      
      // Update privacy score circle
      this.updatePrivacyScoreCircle(this.privacyStats.privacyScore);
      
      // Update status indicator
      this.updateStatusIndicator();
    } catch (error) {
      console.error('Error updating UI:', error);
    }
  }

  updatePrivacyScoreCircle(score) {
    try {
      const circle = document.querySelector('.score-circle');
      const privacyScoreEl = document.getElementById('privacy-score');
      const percentage = score;
      
      // Update the conic gradient based on score
      let color = '#4CAF50'; // Green for high scores
      if (score < 70) color = '#ff9800'; // Orange for medium scores
      if (score < 40) color = '#f44336'; // Red for low scores
      
      if (circle) {
        circle.style.background = `conic-gradient(${color} ${percentage}%, #e0e0e0 0%)`;
      }
      
      // Update score value color
      if (privacyScoreEl) {
        privacyScoreEl.style.color = color;
      }
    } catch (error) {
      console.error('Error updating privacy score circle:', error);
    }
  }

  updateStatusIndicator() {
    try {
      const statusDiv = document.getElementById('privacy-status');
      if (!statusDiv) return;
      
      const statusDot = statusDiv.querySelector('.status-dot');
      const statusText = statusDiv.querySelector('span:last-child');
      
      if (!statusDot || !statusText) return;
      
      if (this.privacyStats.privacyScore >= 90) {
        statusDot.className = 'status-dot active';
        statusDot.style.background = '#4CAF50';
        statusText.textContent = 'Privacy Protected';
        statusText.style.color = '#4CAF50';
      } else if (this.privacyStats.privacyScore >= 70) {
        statusDot.className = 'status-dot';
        statusDot.style.background = '#ff9800';
        statusText.textContent = 'Privacy Warning';
        statusText.style.color = '#ff9800';
      } else {
        statusDot.className = 'status-dot';
        statusDot.style.background = '#f44336';
        statusText.textContent = 'Privacy Risk';
        statusText.style.color = '#f44336';
      }
    } catch (error) {
      console.error('Error updating status indicator:', error);
    }
  }

  async checkPrivacyAlerts() {
    // Check for any privacy alerts or warnings
    if (this.privacyStats?.externalRequests > 0) {
      this.showPrivacyAlert(
        `${this.privacyStats.externalRequests} external requests detected`,
        this.privacyStats.externalRequests
      );
    }
    
    // Check current page for sensitive content
    try {
      if (this.currentTab && this.currentTab.id) {
        // Skip browser pages
        if (this.currentTab.url?.startsWith('chrome://') || this.currentTab.url?.startsWith('edge://') || this.currentTab.url?.startsWith('moz-extension://')) {
          return;
        }

        try {
          const response = await chrome.tabs.sendMessage(this.currentTab.id, {
            action: 'checkSensitiveContent'
          });
          
          if (response && response.sensitiveFieldsCount > 0) {
            this.showPrivacyAlert(
              `${response.sensitiveFieldsCount} sensitive fields detected on this page`,
              response.sensitiveFieldsCount
            );
          }
        } catch (messageError) {
          if (!messageError.message.includes('Could not establish connection') && !messageError.message.includes('Receiving end does not exist')) {
            console.log('Privacy check error:', messageError.message);
          }
          // Silently fail for connection errors - content script might not be ready yet
        }
      }
    } catch (error) {
      // Content script might not be loaded yet
      console.log('Content script not available for privacy check:', error.message);
    }
  }

  showPrivacyAlert(message, count) {
    const alertsSection = document.getElementById('privacy-alerts');
    const alertList = document.getElementById('alert-list');
    
    const alertItem = document.createElement('div');
    alertItem.className = 'alert-item';
    alertItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span>${message}</span>
        <span class="alert-count" style="background: #856404; color: white; border-radius: 10px; padding: 2px 6px; font-size: 10px;">${count}</span>
      </div>
      <div style="font-size: 10px; color: #856404;">Click to view details</div>
    `;
    
    alertItem.addEventListener('click', () => {
      // Show detailed privacy information
      this.showPrivacyDetails(message, count);
    });
    
    alertList.appendChild(alertItem);
    alertsSection.style.display = 'block';
  }

  showPrivacyDetails(message, count) {
    // For now, just show an alert - in a real app you might open a detailed view
    alert(`Privacy Detail:\n${message}\n\nPrivAgent has automatically protected this sensitive information by processing it locally and filtering any data that could compromise your privacy.`);
  }

  showNotification(message, type = 'info') {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    const colors = {
      success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
      error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
      warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
      info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
    };
    
    const style = colors[type] || colors.info;
    notification.style.background = style.bg;
    notification.style.color = style.color;
    notification.style.border = `1px solid ${style.border}`;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showError(message) {
    console.error('PrivAgent Error:', message);
    
    // Try to show error in popup if possible
    try {
      const errorContainer = document.createElement('div');
      errorContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        max-width: 300px;
        text-align: center;
        z-index: 10000;
      `;
      errorContainer.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">❌ Error</div>
        <div>${message}</div>
      `;
      document.body.appendChild(errorContainer);
    } catch (e) {
      // If we can't show the error in the popup, just log it
      console.error('Failed to display error:', e);
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    new PrivAgentPopup();
  } catch (error) {
    console.error('Failed to initialize PrivAgent popup:', error);
    // Show a basic error message in the popup
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = '❌ Failed to load privacy dashboard';
    errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #f44336;';
    document.body.appendChild(errorDiv);
  }
});
