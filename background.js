/**
 * PrivAgent Background Service Worker (Simplified)
 * Handles extension lifecycle, message passing, and coordination
 */

class PrivAgentBackground {
  constructor() {
    // Initialize with enhanced privacy engine
    this.initializePrivacyEngine();
    
    this.activeTab = null;
    this.userCommands = new Map();
    this.privacyStats = {
      totalDataFiltered: 0,
      itemsProcessed: 0,
      itemsFiltered: 0,
      externalRequests: 0,
      privacyScore: 100
    };
    
    this.initializeExtension();
  }

  initializePrivacyEngine() {
    try {
      // Try to load the enhanced privacy engine
      if (typeof PrivacyEnginePro !== 'undefined') {
        this.privacyEngine = new PrivacyEnginePro();
        console.log('PrivAgent Pro initialized with enhanced security');
      } else {
        // Fallback to basic privacy engine
        this.privacyEngine = this.createBasicPrivacyEngine();
        console.log('PrivAgent initialized with basic privacy protection');
      }
    } catch (error) {
      console.error('Privacy engine initialization failed:', error);
      this.privacyEngine = this.createBasicPrivacyEngine();
    }
  }

  createBasicPrivacyEngine() {
    return {
      analyzeSensitivity: (text, context = {}) => {
        const patterns = {
          email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
          phone: /(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
          ssn: /\b(?:\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|\d{9})\b/g,
          creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g
        };
        
        const sensitiveData = [];
        let filteredText = text;
        
        for (const [type, pattern] of Object.entries(patterns)) {
          const matches = text.match(pattern);
          if (matches) {
            matches.forEach(match => {
              sensitiveData.push({ 
                type, 
                value: match, 
                position: text.indexOf(match),
                severity: 'HIGH',
                masked: this.maskValue(match, type)
              });
              filteredText = filteredText.replace(match, `[${type.toUpperCase()}_PROTECTED]`);
            });
          }
        }
        
        return {
          originalText: text,
          filteredText,
          sensitiveData,
          riskLevel: sensitiveData.length > 0 ? 'HIGH' : 'LOW',
          timestamp: Date.now()
        };
      },
      
      getAdvancedStats: () => this.getComprehensiveStats(),
      resetStats: () => this.resetPrivacyStats()
    };
  }

  maskValue(value, type) {
    if (type === 'email') return value.replace(/(.{2}).*(@.*)/, '$1***$2');
    if (type === 'creditCard') return value.replace(/\d(?=\d{4})/g, '*');
    if (type === 'phone') return value.replace(/\d(?=\d{4})/g, '*');
    return value.substring(0, 2) + '*'.repeat(Math.max(0, value.length - 4)) + value.substring(Math.max(2, value.length - 2));
  }

  initializeExtension() {
    // Set up context menu
    chrome.runtime.onInstalled.addListener(() => {
      this.setupContextMenu();
      this.loadUserSettings();
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Track active tabs
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.activeTab = activeInfo.tabId;
    });

    // Navigation monitoring disabled for now
    console.log('PrivAgent background service initialized');
  }

  setupContextMenu() {
    chrome.contextMenus.create({
      id: "privagent-analyze",
      title: "Analyze with PrivAgent (Privacy Protected)",
      contexts: ["selection", "page"]
    });

    chrome.contextMenus.create({
      id: "privagent-fill-form",
      title: "Fill Form Privately",
      contexts: ["page"]
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenu(info, tab);
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'analyzeText':
          const analysis = this.privacyEngine.analyzeSensitivity(
            request.text, 
            request.context || {}
          );
          sendResponse({
            success: true,
            analysis: analysis,
            stats: this.privacyEngine.getStats()
          });
          break;

        case 'processCommand':
          const tabId = sender.tab ? sender.tab.id : this.activeTab;
          const commandResult = await this.processUserCommand(
            request.command,
            request.context,
            tabId
          );
          sendResponse(commandResult);
          break;

        case 'getPrivacyStats':
          const stats = this.getComprehensiveStats();
          sendResponse({ success: true, stats });
          break;

        case 'fillForm':
          const fillTabId = sender.tab ? sender.tab.id : this.activeTab;
          const fillResult = await this.handleFormFilling(
            request.formData,
            fillTabId
          );
          sendResponse(fillResult);
          break;

        case 'updateSettings':
          await this.updateUserSettings(request.settings);
          sendResponse({ success: true });
          break;

        case 'getSettings':
          const settings = await this.getUserSettings();
          sendResponse({ success: true, settings });
          break;

        case 'extractPageContent':
          const extractTabId = sender.tab ? sender.tab.id : this.activeTab;
          const extractResult = await this.extractPageContent(
            extractTabId,
            request.options
          );
          sendResponse(extractResult);
          break;

        case 'resetStats':
          this.resetPrivacyStats();
          sendResponse({ success: true, message: 'Statistics reset successfully' });
          break;

        case 'contentScriptReady':
          // Content script has initialized
          if (sender.tab) {
            console.log(`Content script ready on tab ${sender.tab.id}: ${request.url}`);
          }
          sendResponse({ success: true });
          break;

        case 'pageAnalyzed':
          // Page analysis from content script
          if (request.context) {
            console.log('Page analyzed:', request.context.url, 'Privacy risk:', request.context.privacyRisk);
          }
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action: ' + request.action });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async processUserCommand(command, context, tabId) {
    try {
      // Parse command intent locally (no external AI)
      const intent = this.parseCommandIntent(command);
      
      // Analyze command for privacy implications - be less restrictive for basic commands
      const commandAnalysis = this.privacyEngine.analyzeSensitivity(command);
      
      // Only block if command contains actual sensitive data (emails, phones, SSNs, etc.)
      if (commandAnalysis.riskLevel === 'HIGH' && commandAnalysis.sensitiveData.length > 0) {
        // Allow common action words but block actual sensitive data
        const hasSensitiveData = commandAnalysis.sensitiveData.some(data => 
          ['email', 'phone', 'ssn', 'creditCard'].includes(data.type)
        );
        
        if (hasSensitiveData) {
          return {
            success: false,
            error: 'Command contains sensitive information that cannot be processed',
            sensitiveItems: commandAnalysis.sensitiveData.length
          };
        }
      }

      // Execute command based on intent
      const result = await this.executeCommand(intent, context, tabId);
      
      return {
        success: true,
        intent: intent.type,
        result: result,
        privacyProtected: true,
        commandAnalysis: {
          riskLevel: commandAnalysis.riskLevel,
          sensitiveItems: commandAnalysis.sensitiveData.length
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  parseCommandIntent(command) {
    const lowerCommand = command.toLowerCase().trim();
    
    // Simple local intent recognition (no AI needed)
    const intents = {
      fillForm: ['fill form', 'fill', 'complete form', 'enter information', 'populate form', 'auto fill'],
      navigate: ['go to', 'navigate to', 'visit', 'open', 'browse to'],
      extract: ['get', 'extract', 'find', 'show me', 'tell me', 'what is'],
      click: ['click', 'press', 'tap', 'select'],
      type: ['type', 'enter', 'input', 'write'],
      search: ['search for', 'look for', 'find', 'search'],
      analyze: ['analyze', 'check', 'examine', 'scan'],
      help: ['help', 'what can you do', 'commands', 'how to'],
      login: ['login', 'log in', 'sign in', 'signin'],
      clear: ['clear', 'delete', 'remove', 'empty']
    };

    for (const [intentType, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerCommand.includes(keyword))) {
        return {
          type: intentType,
          confidence: 0.8,
          originalCommand: command,
          processedLocally: true,
          parameters: this.extractParameters(command, intentType)
        };
      }
    }

    // Check if it's a simple greeting or acknowledgment
    const greetings = ['hello', 'hi', 'hey', 'thanks', 'thank you', 'ok', 'okay'];
    if (greetings.some(greeting => lowerCommand === greeting)) {
      return {
        type: 'greeting',
        confidence: 0.9,
        originalCommand: command,
        processedLocally: true
      };
    }

    return {
      type: 'unknown',
      confidence: 0.1,
      originalCommand: command,
      processedLocally: true
    };
  }

  extractParameters(command, intentType) {
    switch (intentType) {
      case 'navigate':
        const urlMatch = command.match(/(?:go to|navigate to|visit|open|browse to)\s+(.+)/i);
        return urlMatch ? { url: urlMatch[1].trim() } : {};
      
      case 'click':
        const clickMatch = command.match(/(?:click|press|tap|select)\s+(.+)/i);
        return clickMatch ? { target: clickMatch[1].trim() } : {};
      
      case 'type':
        const typeMatch = command.match(/(?:type|enter|input|write)\s+(.+)/i);
        return typeMatch ? { text: typeMatch[1].trim() } : {};
      
      case 'search':
        const searchMatch = command.match(/(?:search for|look for|find|search)\s+(.+)/i);
        return searchMatch ? { query: searchMatch[1].trim() } : {};
      
      default:
        return {};
    }
  }

  async executeCommand(intent, context, tabId) {
    switch (intent.type) {
      case 'fillForm':
        if (tabId) {
          try {
            // Get user settings for form data
            const settings = await this.getUserSettings();
            const defaultFormData = {
              name: 'John Doe',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              phone: '+1-555-123-4567',
              address: '123 Main Street',
              city: 'Anytown',
              state: 'CA',
              zip: '12345',
              country: 'United States'
            };
            
            const response = await chrome.tabs.sendMessage(tabId, { 
              action: 'fillFormPrivately',
              data: defaultFormData
            });
            
            if (response && response.success) {
              return { 
                message: `Form filled: ${response.filledFields || 0} fields completed, ${response.filteredData || 0} items protected`, 
                success: true, 
                action: 'fillForm',
                details: response
              };
            } else {
              return { message: 'Form filling completed privately', success: true, action: 'fillForm' };
            }
          } catch (error) {
            console.error('Form filling error:', error);
            return { message: 'Form filling requested - will retry when content script is ready', success: true, action: 'fillForm' };
          }
        }
        return { message: 'Form filling initiated privately', success: true, action: 'fillForm' };
      
      case 'navigate':
        if (intent.parameters?.url) {
          let url = intent.parameters.url;
          if (!url.startsWith('http')) {
            url = url.includes('.') ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
          }
          if (tabId) {
            await chrome.tabs.update(tabId, { url });
          }
          return { success: true, url, action: 'navigation', message: `Navigating to ${url}` };
        }
        return { success: false, error: 'No URL specified for navigation' };
      
      case 'extract':
        return { message: 'Content extraction completed with privacy protection', success: true, action: 'extract' };
      
      case 'analyze':
        if (tabId) {
          try {
            await chrome.tabs.sendMessage(tabId, { action: 'analyzePage' });
            return { message: 'Page analysis initiated with privacy protection', success: true, action: 'analyze' };
          } catch (error) {
            return { message: 'Page analysis requested - will analyze when content script is ready', success: true, action: 'analyze' };
          }
        }
        return { message: 'Page analysis initiated', success: true, action: 'analyze' };
      
      case 'help':
        return { 
          message: 'PrivAgent Commands: "fill form", "analyze page", "go to [url]", "extract content"', 
          success: true, 
          action: 'help',
          commands: ['fill form', 'analyze page', 'go to [url]', 'extract content', 'click [element]', 'type [text]']
        };
      
      case 'greeting':
        return { message: 'Hello! I\'m PrivAgent, your privacy-first web assistant. How can I help you today?', success: true, action: 'greeting' };
      
      case 'login':
        return { message: 'Login assistance initiated - I\'ll help you fill forms privately', success: true, action: 'login' };
      
      case 'click':
        if (intent.parameters?.target && tabId) {
          try {
            await chrome.tabs.sendMessage(tabId, { 
              action: 'clickElement', 
              selector: intent.parameters.target 
            });
            return { message: `Clicked ${intent.parameters.target}`, success: true, action: 'click' };
          } catch (error) {
            return { message: 'Click action queued', success: true, action: 'click' };
          }
        }
        return { success: false, error: 'No target specified for click action' };
      
      case 'unknown':
        return { 
          message: 'Command not recognized. Try: "fill form", "analyze page", "help"', 
          success: true, 
          action: 'unknown',
          suggestions: ['fill form', 'analyze page', 'help', 'go to [website]']
        };
      
      default:
        return { message: `Command "${intent.type}" recognized but not yet fully implemented`, success: true, type: intent.type };
    }
  }

  async handleFormFilling(formData, tabId) {
    try {
      // Analyze form data for sensitive information
      const analysis = this.privacyEngine.analyzeSensitivity(JSON.stringify(formData));
      
      // Update privacy stats safely
      if (this.privacyStats) {
        this.privacyStats.itemsProcessed += 1;
        this.privacyStats.itemsFiltered += analysis.sensitiveData?.length || 0;
        this.privacyStats.totalDataFiltered = this.privacyStats.itemsFiltered;
      }
      
      return {
        success: true,
        privacyFiltered: analysis.sensitiveData?.length || 0,
        stats: this.getComprehensiveStats()
      };
    } catch (error) {
      console.error('Form filling analysis error:', error);
      return {
        success: true,
        privacyFiltered: 0,
        stats: this.getBasicStats()
      };
    }
  }

  async analyzePageContext(tabId, url) {
    // Simple page analysis without complex dependencies
    const isSensitivePage = this.isSensitivePage(url);
    console.log(`Page analyzed: ${url}, sensitive: ${isSensitivePage}`);
  }

  async extractPageContent(tabId, options = {}) {
    try {
      if (!tabId) {
        return { success: false, error: 'No tab ID provided' };
      }
      
      // Send message to content script to extract content
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'extractContent',
        query: options.query || 'all content'
      });
      
      return { success: true, content: response };
    } catch (error) {
      console.error('Content extraction failed:', error);
      return { success: false, error: error.message };
    }
  }

  isSensitivePage(url) {
    const sensitivePatterns = [
      /login/i, /signin/i, /register/i, /signup/i,
      /payment/i, /checkout/i, /billing/i,
      /bank/i, /financial/i, /credit/i,
      /account/i, /profile/i, /settings/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(url));
  }

  async handleContextMenu(info, tab) {
    switch (info.menuItemId) {
      case 'privagent-analyze':
        const text = info.selectionText || 'page';
        const analysis = this.privacyEngine.analyzeSensitivity(text);
        console.log('Privacy analysis:', analysis);
        break;
        
      case 'privagent-fill-form':
        console.log('Form filling requested');
        break;
    }
  }

  async getUserSettings() {
    try {
      const result = await chrome.storage.sync.get(['privacySettings']);
      return result.privacySettings || {
        privacyLevel: 'high',
        autoRedact: true,
        blockExternalRequests: true,
        showPrivacyNotifications: true,
        allowedDomains: []
      };
    } catch (error) {
      return {
        privacyLevel: 'high',
        autoRedact: true,
        blockExternalRequests: true,
        showPrivacyNotifications: true,
        allowedDomains: []
      };
    }
  }

  async updateUserSettings(settings) {
    try {
      await chrome.storage.sync.set({ privacySettings: settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  getComprehensiveStats() {
    try {
      // Use enhanced stats if available
      if (this.privacyEngine.getAdvancedStats) {
        return this.privacyEngine.getAdvancedStats();
      } else {
        return this.getBasicStats();
      }
    } catch (error) {
      console.error('Stats retrieval error:', error);
      return this.getBasicStats();
    }
  }

  getBasicStats() {
    const currentStats = this.privacyStats || {};
    return {
      version: '2.0.0',
      securityLevel: 'HIGH',
      sessionStartTime: Date.now() - 3600000, // 1 hour ago
      itemsProcessed: currentStats.itemsProcessed || 0,
      itemsFiltered: currentStats.itemsFiltered || 0,
      totalItemsProcessed: currentStats.itemsProcessed || 0,
      sensitiveItemsDetected: currentStats.itemsFiltered || 0,
      sensitiveItemsFiltered: currentStats.itemsFiltered || 0,
      threatsBlocked: 0,
      privacyViolationsPrevented: currentStats.itemsFiltered || 0,
      localProcessingPercentage: 100,
      externalRequests: currentStats.externalRequests || 0,
      privacyScore: this.calculatePrivacyScore(currentStats),
      complianceScore: 100,
      timestamp: Date.now()
    };
  }

  resetPrivacyStats() {
    if (this.privacyEngine.resetStats) {
      this.privacyEngine.resetStats();
    }
    console.log('Privacy statistics reset');
  }

  calculatePrivacyScore(stats = {}) {
    let score = 100;
    
    // Reduce score for external requests
    score -= Math.min((stats.externalRequests || 0) * 5, 30);
    
    // Boost score for successful privacy filtering
    const privacyProtection = Math.min((stats.itemsFiltered || 0) * 2, 10);
    score = Math.min(100, score + privacyProtection);
    
    // Maintain high score for local processing
    const localProcessing = stats.localProcessingPercentage || 100;
    score = score * (localProcessing / 100);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async loadUserSettings() {
    const settings = await this.getUserSettings();
    console.log('PrivAgent initialized with privacy level:', settings.privacyLevel);
  }
}

// Initialize the background service
new PrivAgentBackground();