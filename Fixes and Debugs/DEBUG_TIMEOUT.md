# Debug Timeout Issues

**Enhanced debugging for "Timeout waiting for response" errors**

## 🔍 **Debugging Steps**

### Step 1: Check Console Logs

1. **Open Browser Console**: Press `F12` → Console tab
2. **Reload Extension**: Go to `chrome://extensions/` → PrivAgent → Reload
3. **Try Form Filling**: Use "fill form" command
4. **Watch Console Output**

**Expected Console Logs** (if working correctly):
```javascript
Starting form filling process...
Form data available: ["name", "email", "phone", "address", "city", "state", "zip"]
Ensuring content script on tab: 12345
Tab info: https://amazon.com/ap/signin loading
Pinging content script...
Content script not ready, will inject: Timeout waiting for response  
Injecting content script...
PrivAgent Content Script: Starting initialization...
PrivAgent Content Script: DOM already ready, creating instance
PrivAgent Content Script initializing...
PrivAgent Content Script initialized successfully
Content script injection results: 1 frames
Content script ready after injection: {ready: true, status: "PrivAgent content script ready"}
Filling form on: https://amazon.com/ap/signin
Sending performFill message...
PrivAgent: Starting performFill with details: name,email,phone,address,city,state,zip
PrivAgent: Starting form fill operation on domain: amazon.com
PrivAgent: Filling Amazon login form
PrivAgent: Amazon form fill completed: {success: true, filled: 1, clicked: 1, warnings: [], errors: [], domain: "amazon.com"}
Form filling result: {success: true, filled: 1, clicked: 1, warnings: [], errors: [], domain: "amazon.com"}
Updated privacy stats: {itemsProcessed: 1, itemsFiltered: 0}
```

**If You See Timeout**, look for these error patterns:
- `Cannot inject content script on browser pages` → You're on chrome:// page
- `Content script still not responding after injection` → Content script crashed
- `Failed to inject content script` → Permission/CSP issue

### Step 2: Test on Different Pages

**Test 1: Simple Page** (should work)
```
1. Go to: https://httpbin.org/forms/post
2. Try "fill form" command
3. Check console logs
```

**Test 2: Amazon Login** (complex, might timeout)
```  
1. Go to: https://amazon.com/ap/signin
2. Try "fill form" command
3. Check console logs
```

**Test 3: Browser Page** (should fail gracefully)
```
1. Go to: chrome://extensions/
2. Try "fill form" command  
3. Should show: "Cannot fill forms on browser pages"
```

### Step 3: Manual Content Script Test

**Test Content Script Directly**:
1. Go to any normal webpage (like Amazon)
2. Open console (F12)
3. Run this code:
```javascript
// Test if content script is loaded
if (window.privAgentInitialized) {
  console.log('✅ Content script is loaded');
} else {
  console.log('❌ Content script not loaded');
}

// Test message passing
chrome.runtime.sendMessage({action: 'ping'}, (response) => {
  console.log('Background ping response:', response);
});
```

## 🛠️ **Common Issues & Fixes**

### Issue 1: Content Script Not Loading
**Symptoms**: Console shows injection attempt but no "PrivAgent Content Script" messages

**Causes & Solutions**:
- **CSP (Content Security Policy) blocking**: Some sites block script injection
- **Page not ready**: Try refreshing page before form filling
- **Extension permissions**: Check if extension has access to the site

**Fix**: Add debugging to content script:
1. Check if content script file exists and has no syntax errors
2. Look for CSP errors in console  
3. Try on a simpler page first

### Issue 2: Content Script Crashes
**Symptoms**: "PrivAgent Content Script: Starting initialization..." but then no more messages

**Solutions**:
1. Check for JavaScript errors in console
2. Look for uncaught exceptions in content script
3. Try on different websites

### Issue 3: Message Passing Broken
**Symptoms**: Content script loads but doesn't respond to messages

**Debug Steps**:
1. Check `chrome.runtime.onMessage` listener is set up
2. Verify `sendResponse` is called
3. Test with simple ping message first

## 🧪 **Enhanced Debugging Version**

The latest fixes include:

### ✅ **Added Comprehensive Logging**
- Every step of form filling process now logged
- Content script injection tracked
- Tab validation before injection
- Message timeouts clearly identified

### ✅ **Better Error Handling** 
- Graceful handling of browser page restrictions
- Clear error messages for different failure types  
- Fallback error responses with structured data

### ✅ **Increased Timeouts**
- Form filling: 15 seconds (was 3 seconds)  
- Content script ping: 2 seconds (was 500ms)
- More time for complex operations

### ✅ **Content Script Guards**
- Prevents multiple initialization
- Better error recovery
- Detailed initialization logging

## 📊 **Expected Results After Fixes**

With the enhanced debugging:

**✅ If Working**: You'll see detailed logs showing each step
**✅ If Browser Page**: Clear "Cannot fill forms on browser pages" error  
**✅ If Timeout**: Specific error like "Form filling timed out - the page may be slow or incompatible"
**✅ If No Data**: "No Agent Form Details saved" message

## 🎯 **Next Steps**

1. **Test with enhanced logging** and share the console output
2. **Try different websites** to isolate if it's site-specific
3. **Check extension permissions** in chrome://extensions/
4. **Verify form data is configured** in Privacy Settings

The enhanced debugging will help pinpoint exactly where the timeout occurs in the process! 🔍

---

**🛡️ PrivAgent Debugging - Enhanced Timeout Diagnostics**
*Detailed Logging for Precise Issue Identification*