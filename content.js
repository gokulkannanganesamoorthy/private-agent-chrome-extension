/**
 * PrivAgent Content Script
 * Handles DOM manipulation, form filling, and web page interaction
 * All processing happens locally with privacy protection
 */

class PrivAgentContent {
  constructor() {
    this.privacyEngine = null;
    this.isActive = false;
    this.commandOverlay = null;
    this.privacyIndicator = null;
    this.formsAnalyzed = new Set();
    
    this.initialize();
  }

  async initialize() {
    // Load privacy engine
    await this.loadPrivacyEngine();
    
    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
    
    // Analyze page on load
    this.analyzePage();
    
    // Set up privacy indicator
    this.createPrivacyIndicator();
    
    // Monitor for new forms
    this.observeDOMChanges();
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  async loadPrivacyEngine() {
    // Create a simple fallback privacy engine for now
    this.privacyEngine = {
      analyzeSensitivity: (text, context = {}) => ({
        originalText: text,
        filteredText: text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]'),
        sensitiveData: [],
        riskLevel: 'low'
      }),
      analyzeFormField: (field) => ({
        element: field,
        isSensitive: field.type === 'password' || field.type === 'email',
        sensitivityType: field.type === 'password' ? 'password' : 'none',
        shouldRedact: field.type === 'password',
        confidence: field.type === 'password' ? 0.9 : 0.1
      })
    };
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'fillFormPrivately':
        this.fillFormPrivately(request.data).then(sendResponse);
        break;
        
      case 'extractContent':
        const content = this.extractPageContent(request.query);
        sendResponse(content);
        break;
        
      case 'analyzeElement':
        const analysis = this.analyzeElement(request.selector);
        sendResponse(analysis);
        break;
        
      case 'clickElement':
        this.clickElement(request.selector).then(sendResponse);
        break;
        
      case 'typeText':
        this.typeText(request.selector, request.text).then(sendResponse);
        break;
        
      case 'activate':
        this.activateAgent();
        sendResponse({ success: true });
        break;
        
      case 'deactivate':
        this.deactivateAgent();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  analyzePage() {
    const pageContext = {
      url: window.location.href,
      title: document.title,
      forms: this.analyzeForms(),
      sensitiveFields: this.findSensitiveFields(),
      privacyRisk: this.assessPagePrivacyRisk()
    };
    
    // Send analysis to background script
    chrome.runtime.sendMessage({
      action: 'pageAnalyzed',
      context: pageContext
    });
    
    return pageContext;
  }

  analyzeForms() {
    const forms = document.querySelectorAll('form');
    const formAnalysis = [];
    
    forms.forEach((form, index) => {
      if (this.formsAnalyzed.has(form)) return;
      
      const fields = form.querySelectorAll('input, select, textarea');
      const formData = {
        index,
        element: form,
        fields: [],
        sensitiveFields: 0,
        privacyRisk: 'low'
      };
      
      fields.forEach(field => {
        const fieldAnalysis = this.privacyEngine.analyzeFormField(field);
        formData.fields.push({
          element: field,
          type: field.type,
          name: field.name,
          id: field.id,
          analysis: fieldAnalysis
        });
        
        if (fieldAnalysis.isSensitive) {
          formData.sensitiveFields++;
        }
      });
      
      // Determine form privacy risk
      if (formData.sensitiveFields > 2) {
        formData.privacyRisk = 'high';
      } else if (formData.sensitiveFields > 0) {
        formData.privacyRisk = 'medium';
      }
      
      this.formsAnalyzed.add(form);
      formAnalysis.push(formData);
    });
    
    return formAnalysis;
  }

  findSensitiveFields() {
    const sensitiveFields = [];
    const allInputs = document.querySelectorAll('input, textarea');
    
    allInputs.forEach(input => {
      const analysis = this.privacyEngine.analyzeFormField(input);
      if (analysis.isSensitive) {
        sensitiveFields.push({
          element: input,
          type: analysis.sensitivityType,
          confidence: analysis.confidence
        });
      }
    });
    
    return sensitiveFields;
  }

  assessPagePrivacyRisk() {
    const url = window.location.href.toLowerCase();
    const content = document.body.textContent.toLowerCase();
    
    let riskScore = 0;
    
    // URL-based risk assessment
    const riskKeywords = ['login', 'signin', 'register', 'payment', 'checkout', 'bank', 'financial'];
    riskKeywords.forEach(keyword => {
      if (url.includes(keyword)) riskScore += 2;
    });
    
    // Content-based risk assessment
    const sensitiveTerms = ['password', 'credit card', 'ssn', 'social security', 'bank account'];
    sensitiveTerms.forEach(term => {
      if (content.includes(term)) riskScore += 1;
    });
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  async fillFormPrivately(userData) {
    const forms = this.analyzeForms();
    let filledFields = 0;
    let filteredData = 0;
    
    for (const form of forms) {
      for (const fieldData of form.fields) {
        const field = fieldData.element;
        const fieldType = fieldData.analysis.sensitivityType;
        
        // Find matching user data
        const value = this.findMatchingUserData(fieldData, userData);
        if (value) {
          // Analyze value for privacy before filling
          const valueAnalysis = this.privacyEngine.analyzeSensitivity(value);
          
          if (valueAnalysis.riskLevel === 'high' && fieldData.analysis.shouldRedact) {
            // Show privacy warning
            this.showPrivacyWarning(field, valueAnalysis);
            filteredData++;
          } else {
            // Fill field with privacy-filtered value
            await this.fillField(field, valueAnalysis.filteredText);
            filledFields++;
          }
        }
      }
    }
    
    return {
      success: true,
      filledFields,
      filteredData,
      formsProcessed: forms.length
    };
  }

  findMatchingUserData(fieldData, userData) {
    const field = fieldData.element;
    const fieldName = field.name?.toLowerCase() || '';
    const fieldId = field.id?.toLowerCase() || '';
    const fieldType = fieldData.analysis.sensitivityType;
    
    // Map field types to user data keys
    const dataMapping = {
      email: ['email', 'emailAddress', 'userEmail'],
      phone: ['phone', 'phoneNumber', 'mobile', 'telephone'],
      address: ['address', 'streetAddress', 'homeAddress'],
      name: ['name', 'fullName', 'firstName', 'lastName'],
      city: ['city', 'locality'],
      state: ['state', 'region'],
      zip: ['zip', 'zipCode', 'postalCode']
    };
    
    // First try direct field name/id match
    if (userData[fieldName]) return userData[fieldName];
    if (userData[fieldId]) return userData[fieldId];
    
    // Try mapped field types
    const mappings = dataMapping[fieldType] || [];
    for (const mapping of mappings) {
      if (userData[mapping]) return userData[mapping];
    }
    
    return null;
  }

  async fillField(field, value) {
    // Focus the field
    field.focus();
    
    // Clear existing value
    field.value = '';
    
    // Type the value character by character for better compatibility
    for (let i = 0; i < value.length; i++) {
      field.value += value[i];
      field.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Trigger change event
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.blur();
  }

  extractPageContent(query) {
    const lowerQuery = query.toLowerCase();
    const results = {
      content: '',
      elements: [],
      privacyFiltered: false
    };
    
    // Extract based on query type
    if (lowerQuery.includes('form') || lowerQuery.includes('input')) {
      results.elements = this.extractFormData();
    } else if (lowerQuery.includes('text') || lowerQuery.includes('content')) {
      results.content = this.extractTextContent();
    } else if (lowerQuery.includes('link') || lowerQuery.includes('url')) {
      results.elements = this.extractLinks();
    } else {
      // General content extraction
      results.content = this.extractRelevantContent(query);
    }
    
    // Filter content for privacy
    if (results.content) {
      const analysis = this.privacyEngine.analyzeSensitivity(results.content);
      results.content = analysis.filteredText;
      results.privacyFiltered = analysis.sensitiveData.length > 0;
    }
    
    return results;
  }

  extractTextContent() {
    // Get main content, avoiding navigation and ads
    const contentSelectors = [
      'main', 'article', '.content', '#content', 
      '.post', '.entry', '.page-content'
    ];
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    // Fallback to body content
    return document.body.textContent.trim();
  }

  extractFormData() {
    const forms = document.querySelectorAll('form');
    const formData = [];
    
    forms.forEach(form => {
      const fields = form.querySelectorAll('input, select, textarea');
      const formInfo = {
        action: form.action,
        method: form.method,
        fields: []
      };
      
      fields.forEach(field => {
        formInfo.fields.push({
          type: field.type,
          name: field.name,
          id: field.id,
          placeholder: field.placeholder,
          value: field.value,
          required: field.required
        });
      });
      
      formData.push(formInfo);
    });
    
    return formData;
  }

  extractLinks() {
    const links = document.querySelectorAll('a[href]');
    return Array.from(links).map(link => ({
      text: link.textContent.trim(),
      url: link.href,
      title: link.title
    }));
  }

  extractRelevantContent(query) {
    // Simple relevance matching
    const allText = document.body.textContent;
    const queryWords = query.toLowerCase().split(' ');
    const sentences = allText.split(/[.!?]+/);
    
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return queryWords.some(word => lowerSentence.includes(word));
    });
    
    return relevantSentences.join('. ').trim();
  }

  async clickElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }
    
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait for scroll
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click element
    element.click();
    
    return { success: true, element: selector };
  }

  async typeText(selector, text) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }
    
    // Analyze text for privacy
    const analysis = this.privacyEngine.analyzeSensitivity(text);
    if (analysis.riskLevel === 'high') {
      return { 
        success: false, 
        error: 'Text contains sensitive information',
        sensitiveItems: analysis.sensitiveData.length 
      };
    }
    
    await this.fillField(element, analysis.filteredText);
    
    return { 
      success: true, 
      element: selector,
      privacyFiltered: analysis.sensitiveData.length > 0
    };
  }

  createPrivacyIndicator() {
    this.privacyIndicator = document.createElement('div');
    this.privacyIndicator.id = 'privagent-indicator';
    this.privacyIndicator.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-family: Arial, sans-serif;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        cursor: pointer;
        display: none;
      ">
        🛡️ PrivAgent Active - 100% Private
      </div>
    `;
    
    document.body.appendChild(this.privacyIndicator);
    
    // Show indicator when forms are detected
    if (document.querySelectorAll('form').length > 0) {
      this.showPrivacyIndicator();
    }
  }

  showPrivacyIndicator() {
    const indicator = this.privacyIndicator.querySelector('div');
    indicator.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 5000);
  }

  showPrivacyWarning(field, analysis) {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: absolute;
      background: #ff9800;
      color: white;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      max-width: 200px;
    `;
    
    warning.textContent = `Privacy Alert: ${analysis.sensitiveData.length} sensitive items detected and filtered`;
    
    // Position near the field
    const rect = field.getBoundingClientRect();
    warning.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    warning.style.left = rect.left + 'px';
    
    document.body.appendChild(warning);
    
    // Remove after 3 seconds
    setTimeout(() => {
      warning.remove();
    }, 3000);
  }

  observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      let newFormsDetected = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'FORM' || node.querySelector('form')) {
                newFormsDetected = true;
              }
            }
          });
        }
      });
      
      if (newFormsDetected) {
        this.analyzePage();
        this.showPrivacyIndicator();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+P to toggle PrivAgent
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.toggleAgent();
      }
      
      // Ctrl+Shift+F to fill forms privately
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.triggerPrivateFormFill();
      }
    });
  }

  toggleAgent() {
    if (this.isActive) {
      this.deactivateAgent();
    } else {
      this.activateAgent();
    }
  }

  activateAgent() {
    this.isActive = true;
    this.showPrivacyIndicator();
    console.log('PrivAgent activated - Privacy protection enabled');
  }

  deactivateAgent() {
    this.isActive = false;
    const indicator = this.privacyIndicator.querySelector('div');
    indicator.style.display = 'none';
    console.log('PrivAgent deactivated');
  }

  triggerPrivateFormFill() {
    chrome.runtime.sendMessage({
      action: 'getSettings'
    }, (response) => {
      if (response.success) {
        // Get user data and fill forms
        chrome.runtime.sendMessage({
          action: 'getUserFormData'
        }, (userData) => {
          if (userData) {
            this.fillFormPrivately(userData);
          }
        });
      }
    });
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PrivAgentContent();
  });
} else {
  new PrivAgentContent();
}