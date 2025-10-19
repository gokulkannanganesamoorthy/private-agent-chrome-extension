# PrivAgent Test Scenarios

**Comprehensive Testing Guide for Form Filling Engine v2.0.0**

## 🧪 Test Environment Setup

### Prerequisites
- Chrome/Chromium browser 88+
- PrivAgent extension loaded in developer mode
- Agent Form Details configured with test data
- Debug mode enabled for detailed logging

### Test Data Setup
Configure in Privacy Settings → Agent Form Details:
```
Name: Test User
Email: test@example.com  
Phone: +1-555-123-4567
Address: 123 Test Street
City: Test City
State: CA
ZIP: 12345
Country: United States
```

## 🎯 Core Functionality Tests

### Test 1: Basic Form Detection
**Target**: Any generic contact form
**Steps**:
1. Navigate to contact form page
2. Click PrivAgent icon → "Fill Forms Privately"
3. Verify fields are detected and filled

**Expected Results**:
- ✅ Name field filled with "Test User"  
- ✅ Email field filled with "test@example.com"
- ✅ Phone field filled with "+1-555-123-4567"
- ✅ Success notification shows field count

**Debug Validation**:
```javascript
// Console should show:
PrivAgent: Starting performFill with details: name,email,phone,address,city,state,zip
PrivAgent: Filling generic form
PrivAgent: Successfully filled field with value: Test User
```

### Test 2: Amazon Two-Step Login
**Target**: https://amazon.com/ap/signin
**Steps**:
1. Navigate to Amazon sign-in page
2. Use PrivAgent form filling
3. Verify two-step process handling

**Expected Results**:
- ✅ Email field (#ap_email) filled automatically
- ✅ "Continue" button clicked automatically  
- ✅ Page waits for password field to appear
- ✅ Password field filled (if configured)
- ✅ "Sign In" button clicked
- ✅ No "Receiving end does not exist" errors

**Debug Validation**:
```javascript
// Console should show:
PrivAgent: Filling Amazon login form
PrivAgent: Amazon email field detected
PrivAgent: Clicked continue button
PrivAgent: Waiting for password field...
PrivAgent: Password field detected, filling
```

### Test 3: Generic Multi-Step Forms
**Target**: Multi-page registration forms
**Steps**:
1. Start form filling on step 1
2. Verify progression through steps
3. Check field detection on each step

**Expected Results**:
- ✅ Fields filled appropriately on each step
- ✅ Navigation between steps works
- ✅ No timeout errors on step transitions
- ✅ Dynamic content properly detected

### Test 4: Iframe Form Handling
**Target**: Embedded forms in iframes
**Steps**:
1. Navigate to page with iframe forms
2. Attempt form filling
3. Check iframe context handling

**Expected Results**:
- ✅ Top-level forms prioritized
- ✅ Iframe forms detected but require user consent
- ✅ No cross-frame security errors
- ✅ Proper iframe safety messaging

## 🛡️ Security & Safety Tests

### Test 5: OTP Field Detection
**Target**: Forms with verification codes
**Test Fields**:
- Input with placeholder "Enter OTP"
- Field with id="verification-code"
- Input with maxlength="6" and type="text"

**Expected Results**:
- ✅ OTP fields automatically skipped
- ✅ Warning: "Skipped OTP field: verification-code"
- ✅ Other fields filled normally
- ✅ Privacy protection maintained

### Test 6: Payment Field Protection
**Target**: Checkout/payment forms
**Test Fields**:
- Credit card number inputs
- CVV/CVC fields  
- Expiration date fields
- Billing information

**Expected Results**:
- ✅ Payment fields skipped by default
- ✅ Warning: "Skipped payment field: card-number"
- ✅ Non-payment fields (name, email) filled
- ✅ User consent required for payment fields

### Test 7: Domain Safety Validation
**Target**: Various domains (safe and unsafe)

**Safe Domains** (should auto-fill):
- amazon.com, github.com, google.com

**Unsafe Domains** (should require consent):
- random-site.com, suspicious-domain.net

**Expected Results**:
- ✅ Safe domains fill automatically
- ✅ Unsafe domains require manual "Fill Forms Privately" click
- ✅ Domain safety messages appear
- ✅ User can override restrictions

## 🔧 Technical Validation Tests

### Test 8: Content Script Injection
**Target**: Various page load scenarios
**Steps**:
1. Test on fast-loading pages
2. Test on slow-loading pages  
3. Test on dynamically generated content

**Expected Results**:
- ✅ Content script loads reliably
- ✅ "Ping" responses work correctly
- ✅ Script injection via ensureContentScript() works
- ✅ No "Could not establish connection" errors

### Test 9: Framework Compatibility
**Target**: React/Vue/Angular websites
**Test Sites**:
- React-based forms
- Vue.js applications
- Angular websites

**Expected Results**:
- ✅ Form fields filled properly
- ✅ Framework validation triggered
- ✅ No JavaScript errors in console
- ✅ State management works correctly

### Test 10: Error Handling & Recovery
**Scenarios**:
1. Network timeouts
2. DOM mutations during filling
3. JavaScript errors on page
4. Extension reload during operation

**Expected Results**:
- ✅ Graceful error handling
- ✅ Helpful error messages to user
- ✅ No browser crashes
- ✅ Proper cleanup on errors

## 📊 Performance & UX Tests

### Test 11: Response Time Validation
**Metrics to Track**:
- Form detection time (< 500ms)
- Field filling completion (< 2 seconds)
- Amazon two-step completion (< 5 seconds)
- Memory usage (< 50MB additional)

**Tools**:
- Chrome DevTools Performance tab
- Extension memory usage monitoring
- Console timing logs

### Test 12: User Feedback Accuracy
**Validation Points**:
- Field count accuracy: "X fields filled"
- Button click reporting: "Y buttons clicked"  
- Warning count: "Z warnings"
- Error reporting clarity

**Expected Results**:
- ✅ Counts match actual actions performed
- ✅ Warnings provide actionable information
- ✅ Success messages are encouraging
- ✅ Error messages help troubleshooting

## 🌐 Browser Compatibility Tests

### Test 13: Chrome Variants
**Target Browsers**:
- Google Chrome (latest)
- Microsoft Edge (Chromium)
- Brave Browser
- Vivaldi

**Test Matrix**:
| Browser | Basic Filling | Amazon Login | Multi-Step | Iframes |
|---------|---------------|--------------|------------|---------|
| Chrome  | ✅            | ✅           | ✅         | ✅      |
| Edge    | ✅            | ✅           | ✅         | ✅      |
| Brave   | ✅            | ✅           | ✅         | ✅      |
| Vivaldi | ✅            | ✅           | ✅         | ✅      |

## 🚨 Edge Case Tests

### Test 14: Unusual Form Configurations
**Scenarios**:
- Forms with no labels
- Fields with unusual IDs/names
- Dynamically generated forms
- Forms with custom components

**Expected Results**:
- ✅ Fallback detection works
- ✅ Heuristic analysis functional
- ✅ Graceful degradation
- ✅ No crashes on unusual markup

### Test 15: High-Volume Form Testing
**Test Cases**:
- Forms with 50+ fields
- Multiple forms on same page
- Rapid successive form filling
- Memory leak testing

**Performance Targets**:
- ✅ No significant memory leaks
- ✅ Performance remains acceptable
- ✅ No browser slowdown
- ✅ Extension remains responsive

## 📋 Regression Test Checklist

### Pre-Release Validation

**Core Features** ✅
- [ ] Basic form detection and filling
- [ ] Amazon two-step login process
- [ ] Multi-step form navigation
- [ ] OTP field skipping
- [ ] Payment field protection
- [ ] Domain safety checks

**Privacy Features** ✅
- [ ] Local-only data processing
- [ ] No external network requests
- [ ] Sensitive data redaction
- [ ] Privacy score calculation
- [ ] Real-time protection alerts

**User Experience** ✅
- [ ] Popup interface functionality
- [ ] Settings configuration
- [ ] Error message clarity
- [ ] Success notification accuracy
- [ ] Debug logging (when enabled)

**Technical Stability** ✅
- [ ] Content script injection reliability
- [ ] Message passing between scripts
- [ ] Memory usage optimization
- [ ] Cross-frame security
- [ ] Extension reload handling

## 📊 Test Results Template

### Test Execution Log
```
Test Date: [DATE]
PrivAgent Version: 2.0.0
Chrome Version: [VERSION]
Operating System: [OS]

Test Results Summary:
├── Passed: XX/XX tests
├── Failed: XX/XX tests  
├── Skipped: XX/XX tests
└── Coverage: XX%

Critical Issues Found: [NONE/LIST]
Performance Issues: [NONE/LIST]
User Experience Issues: [NONE/LIST]

Overall Assessment: [PASS/FAIL/NEEDS WORK]
```

### Bug Report Template
```
Bug ID: BUG-001
Severity: [HIGH/MEDIUM/LOW]
Test Case: [Test X: Description]
Environment: [Browser/OS/Version]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]  
3. [Step 3]

Expected Result: [Expected behavior]
Actual Result: [What actually happened]
Console Logs: [Relevant error messages]

Workaround: [If available]
Fix Priority: [HIGH/MEDIUM/LOW]
```

## 🎯 Success Criteria

### Definition of Done
For PrivAgent form filling to be considered production-ready:

**Functional Requirements** (100% pass rate):
- ✅ Basic form filling works on 95%+ of standard forms
- ✅ Amazon login completes successfully 100% of time
- ✅ No "Receiving end does not exist" errors
- ✅ OTP/payment fields properly skipped
- ✅ Domain safety enforced correctly

**Performance Requirements**:
- ✅ Form detection completes within 500ms
- ✅ Filling process completes within 3 seconds
- ✅ Memory usage stays below 50MB
- ✅ No memory leaks during extended use

**Security Requirements**:
- ✅ Zero external network requests during operation
- ✅ All sensitive data processing happens locally
- ✅ No data persistence beyond user configuration
- ✅ Proper error handling prevents data exposure

**User Experience Requirements**:
- ✅ Clear, actionable success/error messages
- ✅ Intuitive popup interface
- ✅ Reliable keyboard shortcuts
- ✅ Helpful troubleshooting guidance

---

**🧪 PrivAgent Testing Framework**
*Ensuring Privacy-First Form Automation Works Perfectly*

Ready for comprehensive testing to validate all functionality before release.