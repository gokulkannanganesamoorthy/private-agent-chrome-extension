/**
 * PrivAgent Privacy Engine
 * Core system for detecting and redacting sensitive information
 */

class PrivacyEngine {
  constructor() {
    this.patterns = {
      // Personal Identifiable Information (PII)
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      ssn: /\b(?:\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|\d{9})\b/g,
      
      // Financial Information
      creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      bankAccount: /\b\d{8,17}\b/g,
      routingNumber: /\b[0-9]{9}\b/g,
      
      // Authentication & Security
      password: /password[:\s=]*[^\s\n]{6,}/gi,
      apiKey: /(?:api[_-]?key|token|secret)[:\s=]*[a-zA-Z0-9+/=]{16,}/gi,
      
      // Address Information
      address: /\b\d{1,6}\s+[A-Za-z0-9\s,.-]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|place|pl)\b/gi,
      zipCode: /\b\d{5}(?:[-\s]\d{4})?\b/g,
      
      // Government IDs
      driverLicense: /\b[A-Z]{1,2}\d{6,8}\b/g,
      passport: /\b[A-Z]{2}\d{7}\b/g,
      
      // Health Information
      medicalRecord: /\b(?:MRN|medical record|patient id)[:\s=]*[A-Z0-9]{6,}\b/gi,
      
      // Biometric
      ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      macAddress: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g
    };
    
    this.contextualKeywords = {
      sensitive: ['password', 'ssn', 'social security', 'credit card', 'bank account', 'personal', 'confidential', 'private'],
      financial: ['payment', 'billing', 'card number', 'account number', 'routing', 'cvv', 'security code'],
      identity: ['name', 'address', 'phone', 'email', 'date of birth', 'dob', 'driver license']
    };
    
    this.stats = {
      totalItemsProcessed: 0,
      sensitiveItemsFiltered: 0,
      localProcessingPercentage: 100,
      externalRequests: 0
    };
  }

  /**
   * Main method to analyze and filter sensitive data
   */
  analyzeSensitivity(text, context = {}) {
    this.stats.totalItemsProcessed++;
    
    const analysis = {
      originalText: text,
      filteredText: text,
      sensitiveData: [],
      riskLevel: 'low',
      contextualRisk: 'low'
    };

    // Check for direct pattern matches
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          analysis.sensitiveData.push({
            type,
            value: match,
            position: text.indexOf(match),
            confidence: this.getConfidence(type, match, text)
          });
        });
      }
    }

    // Contextual analysis
    const contextualRisk = this.analyzeContext(text, context);
    analysis.contextualRisk = contextualRisk;

    // Determine overall risk level
    analysis.riskLevel = this.calculateRiskLevel(analysis.sensitiveData, contextualRisk);

    // Apply filtering
    if (analysis.riskLevel !== 'low') {
      analysis.filteredText = this.applyFiltering(text, analysis.sensitiveData);
      this.stats.sensitiveItemsFiltered += analysis.sensitiveData.length;
    }

    return analysis;
  }

  /**
   * Apply privacy filtering to text
   */
  applyFiltering(text, sensitiveItems) {
    let filteredText = text;
    
    // Sort by position (descending) to avoid offset issues
    sensitiveItems.sort((a, b) => b.position - a.position);
    
    sensitiveItems.forEach(item => {
      const replacement = this.generateReplacement(item.type, item.value);
      filteredText = filteredText.replace(item.value, replacement);
    });
    
    return filteredText;
  }

  /**
   * Generate appropriate replacement for sensitive data
   */
  generateReplacement(type, value) {
    const replacements = {
      email: '[EMAIL_REDACTED]',
      phone: '[PHONE_REDACTED]',
      ssn: '[SSN_REDACTED]',
      creditCard: '[CARD_REDACTED]',
      password: '[PASSWORD_REDACTED]',
      apiKey: '[API_KEY_REDACTED]',
      address: '[ADDRESS_REDACTED]',
      bankAccount: '[ACCOUNT_REDACTED]'
    };
    
    return replacements[type] || '[SENSITIVE_DATA_REDACTED]';
  }

  /**
   * Analyze contextual indicators of sensitivity
   */
  analyzeContext(text, context) {
    const lowerText = text.toLowerCase();
    let contextScore = 0;
    
    // Check for contextual keywords
    for (const [category, keywords] of Object.entries(this.contextualKeywords)) {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          contextScore += category === 'sensitive' ? 3 : 2;
        }
      });
    }
    
    // Check URL context
    if (context.url) {
      const url = context.url.toLowerCase();
      if (url.includes('login') || url.includes('payment') || url.includes('checkout')) {
        contextScore += 3;
      }
      if (url.includes('bank') || url.includes('financial')) {
        contextScore += 4;
      }
    }
    
    // Check form context
    if (context.formFields) {
      const sensitiveFieldCount = context.formFields.filter(field => 
        ['password', 'ssn', 'credit', 'card', 'cvv'].some(sensitive => 
          field.toLowerCase().includes(sensitive)
        )
      ).length;
      contextScore += sensitiveFieldCount * 2;
    }
    
    if (contextScore >= 6) return 'high';
    if (contextScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score for pattern matches
   */
  getConfidence(type, match, fullText) {
    const baseConfidence = {
      email: 0.9,
      phone: 0.8,
      ssn: 0.95,
      creditCard: 0.9,
      password: 0.7,
      apiKey: 0.8
    };
    
    let confidence = baseConfidence[type] || 0.7;
    
    // Adjust based on context
    const lowerText = fullText.toLowerCase();
    if (type === 'password' && lowerText.includes('password')) {
      confidence = 0.95;
    }
    if (type === 'creditCard' && (lowerText.includes('card') || lowerText.includes('payment'))) {
      confidence = 0.95;
    }
    
    return confidence;
  }

  /**
   * Calculate overall risk level
   */
  calculateRiskLevel(sensitiveItems, contextualRisk) {
    if (sensitiveItems.length === 0) return 'low';
    
    const highRiskTypes = ['ssn', 'creditCard', 'password', 'apiKey'];
    const hasHighRisk = sensitiveItems.some(item => highRiskTypes.includes(item.type));
    
    if (hasHighRisk || contextualRisk === 'high') return 'high';
    if (sensitiveItems.length > 2 || contextualRisk === 'medium') return 'medium';
    
    return 'low';
  }

  /**
   * Analyze form fields for sensitivity
   */
  analyzeFormField(fieldElement) {
    const analysis = {
      element: fieldElement,
      isSensitive: false,
      sensitivityType: 'none',
      shouldRedact: false,
      confidence: 0
    };

    const fieldName = (fieldElement.name || '').toLowerCase();
    const fieldId = (fieldElement.id || '').toLowerCase();
    const fieldType = (fieldElement.type || '').toLowerCase();
    const placeholder = (fieldElement.placeholder || '').toLowerCase();
    const label = this.findFieldLabel(fieldElement);

    const allText = `${fieldName} ${fieldId} ${fieldType} ${placeholder} ${label}`.toLowerCase();

    // Check for sensitive field indicators
    const sensitiveIndicators = {
      password: ['password', 'pwd', 'pass'],
      ssn: ['ssn', 'social', 'security'],
      creditCard: ['card', 'credit', 'cc', 'cardnumber'],
      email: ['email', 'e-mail'],
      phone: ['phone', 'tel', 'mobile'],
      address: ['address', 'street', 'city', 'zip'],
      financial: ['account', 'routing', 'bank', 'cvv', 'cvc', 'expiry']
    };

    for (const [type, indicators] of Object.entries(sensitiveIndicators)) {
      if (indicators.some(indicator => allText.includes(indicator))) {
        analysis.isSensitive = true;
        analysis.sensitivityType = type;
        analysis.confidence = 0.8;
        analysis.shouldRedact = ['password', 'ssn', 'creditCard'].includes(type);
        break;
      }
    }

    return analysis;
  }

  /**
   * Find label associated with form field
   */
  findFieldLabel(fieldElement) {
    // Check for explicit label
    if (fieldElement.id) {
      const label = document.querySelector(`label[for="${fieldElement.id}"]`);
      if (label) return label.textContent || '';
    }

    // Check for parent label
    const parentLabel = fieldElement.closest('label');
    if (parentLabel) return parentLabel.textContent || '';

    // Check for nearby text
    const prevSibling = fieldElement.previousElementSibling;
    if (prevSibling && prevSibling.tagName.toLowerCase() === 'label') {
      return prevSibling.textContent || '';
    }

    return '';
  }

  /**
   * Get current privacy statistics
   */
  getStats() {
    return {
      ...this.stats,
      localProcessingPercentage: this.stats.externalRequests > 0 ? 
        Math.max(0, 100 - (this.stats.externalRequests / this.stats.totalItemsProcessed * 100)) : 100
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalItemsProcessed: 0,
      sensitiveItemsFiltered: 0,
      localProcessingPercentage: 100,
      externalRequests: 0
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrivacyEngine;
} else if (typeof window !== 'undefined') {
  window.PrivacyEngine = PrivacyEngine;
}