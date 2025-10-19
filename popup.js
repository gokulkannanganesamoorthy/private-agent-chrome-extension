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
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async loadPrivacyStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getPrivacyStats' });
      if (response.success) {
        this.privacyStats = { ...this.privacyStats, ...response.stats };
      }
    } catch (error) {
      console.error('Error loading privacy stats:', error);
    }
  }

  setupEventListeners() {
    // Command input and send
    const commandInput = document.getElementById('command-input');
    const commandSend = document.getElementById('command-send');
    
    commandSend.addEventListener('click', () => this.processCommand());
    commandInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.processCommand();
      }
    });

    // Suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const command = e.target.getAttribute('data-command');
        commandInput.value = command;
        this.processCommand();
      });
    });

    // Action buttons
    document.getElementById('fill-forms').addEventListener('click', () => {
      this.fillFormsPrivately();
    });

    document.getElementById('analyze-page').addEventListener('click', () => {
      this.analyzePage();
    });

    // Settings button
    document.getElementById('open-settings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  async processCommand() {
    const commandInput = document.getElementById('command-input');
    const command = commandInput.value.trim();
    
    if (!command) return;

    // Show loading state
    this.showCommandLoading();
    
    try {
      // Send command to background script for processing
      const response = await chrome.runtime.sendMessage({
        action: 'processCommand',
        command: command,
        context: {
          url: this.currentTab.url,
          title: this.currentTab.title
        }
      });

      if (response.success) {
        this.showCommandResponse(response);
      } else {
        this.showCommandError(response.error);
      }
    } catch (error) {
      this.showCommandError('Failed to process command: ' + error.message);
    }

    // Clear input
    commandInput.value = '';
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
          responseText += `\n${response.result.message}`;
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
      // Get user form data
      const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
      
      if (!settingsResponse.success) {
        this.showNotification('Please configure your form data in settings first', 'warning');
        return;
      }

      // Send form fill command to active tab
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'fillFormPrivately',
        data: this.getDefaultFormData() // You might want to get this from storage
      });

      if (response.success) {
        this.showNotification(
          `✅ Forms filled privately: ${response.filledFields} fields, ${response.filteredData} items protected`,
          'success'
        );
        
        // Update stats
        this.loadPrivacyStats().then(() => this.updateUI());
      } else {
        this.showNotification(`❌ Failed to fill forms: ${response.error}`, 'error');
      }
    } catch (error) {
      this.showNotification(`❌ Error: ${error.message}`, 'error');
    }
  }

  async analyzePage() {
    try {
      // Send analyze command to content script
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
      }
    } catch (error) {
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
    // Update privacy score
    document.getElementById('privacy-score').textContent = this.privacyStats.privacyScore;
    document.getElementById('local-processing').textContent = this.privacyStats.localProcessingPercentage + '%';
    document.getElementById('external-requests').textContent = this.privacyStats.externalRequests;
    
    // Update statistics
    document.getElementById('items-processed').textContent = this.privacyStats.itemsProcessed;
    document.getElementById('items-filtered').textContent = this.privacyStats.itemsFiltered;
    
    // Update privacy score circle
    this.updatePrivacyScoreCircle(this.privacyStats.privacyScore);
    
    // Update status indicator
    this.updateStatusIndicator();
  }

  updatePrivacyScoreCircle(score) {
    const circle = document.querySelector('.score-circle');
    const percentage = score;
    
    // Update the conic gradient based on score
    let color = '#4CAF50'; // Green for high scores
    if (score < 70) color = '#ff9800'; // Orange for medium scores
    if (score < 40) color = '#f44336'; // Red for low scores
    
    circle.style.background = `conic-gradient(${color} ${percentage}%, #e0e0e0 0%)`;
    
    // Update score value color
    document.getElementById('privacy-score').style.color = color;
  }

  updateStatusIndicator() {
    const statusDiv = document.getElementById('privacy-status');
    const statusDot = statusDiv.querySelector('.status-dot');
    const statusText = statusDiv.querySelector('span:last-child');
    
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
  }

  async checkPrivacyAlerts() {
    // Check for any privacy alerts or warnings
    if (this.privacyStats.externalRequests > 0) {
      this.showPrivacyAlert(
        `${this.privacyStats.externalRequests} external requests detected`,
        this.privacyStats.externalRequests
      );
    }
    
    // Check current page for sensitive content
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
    } catch (error) {
      // Content script might not be loaded yet
      console.log('Content script not available for privacy check');
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
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PrivAgentPopup();
});

// Add some demo functionality for testing
document.addEventListener('DOMContentLoaded', () => {
  // Simulate some privacy statistics for demo
  setTimeout(() => {
    const popup = new PrivAgentPopup();
    popup.privacyStats = {
      privacyScore: 100,
      localProcessingPercentage: 100,
      externalRequests: 0,
      itemsProcessed: 42,
      itemsFiltered: 7
    };
    popup.updateUI();
  }, 100);
});