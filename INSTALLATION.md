# PrivAgent Installation Guide

**Complete Setup Instructions for PrivAgent v2.0.0**

## 📋 Prerequisites

- **Google Chrome** version 88+ (Manifest V3 support required)
- **Operating System**: Windows 10+, macOS 10.14+, or Linux Ubuntu 18.04+
- **Permissions**: Ability to enable Developer Mode in Chrome
- **Storage**: ~10MB free space for extension files

## 🚀 Quick Installation (5 Minutes)

### Step 1: Download PrivAgent

**Option A: GitHub Repository (Recommended)**
```bash
git clone https://github.com/gokulkannanganesamoorthy/privagent-chrome-extension.git
cd privagent-chrome-extension
```

**Option B: Direct Download**
1. Visit: https://github.com/gokulkannanganesamoorthy/privagent-chrome-extension
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file to your desired location
4. Navigate to the `chrome_extension` folder

### Step 2: Install in Chrome

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in your address bar, OR
   - Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner
   - You should see three new buttons appear: "Load unpacked", "Pack extension", "Update"

3. **Load PrivAgent Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `chrome_extension` folder
   - The folder should contain `manifest.json` file
   - Click "Select Folder" (Windows) or "Open" (Mac)

4. **Verify Installation**
   - PrivAgent should appear in your extensions list
   - Look for: "PrivAgent - Privacy-Preserving Web Agent v2.0.0"
   - Status should show as "Enabled"
   - The PrivAgent icon 🔒 should appear in your Chrome toolbar

## ⚙️ Initial Configuration

### Step 3: Configure Privacy Settings

1. **Open PrivAgent**
   - Click the 🔒 PrivAgent icon in your Chrome toolbar
   - The Privacy Dashboard should open

2. **Access Settings**
   - Click "Privacy Settings" button in the popup
   - This opens the comprehensive settings page

3. **Configure Agent Form Details** (Essential for form filling)
   ```
   Navigate to: "Agent Form Details" section
   
   Personal Information:
   ├── Name: Your full name
   ├── Email: Your email address
   ├── Phone: Your phone number (optional)
   └── Address: Complete address details
   
   Important: All data is stored locally in your browser
   Privacy Guarantee: This information NEVER leaves your device
   ```

4. **Save Configuration**
   - Click "Save Settings" button
   - You should see "All settings saved locally" confirmation
   - Settings are automatically synced across your Chrome profile

## 🧪 Test Installation

### Step 4: Verify Everything Works

**Test 1: Basic Functionality**
1. Click PrivAgent icon → Privacy dashboard should open
2. Try typing "help" in the command interface
3. You should see available commands listed

**Test 2: Privacy Detection**
1. Visit any website with forms (e.g., Amazon, GitHub)
2. PrivAgent should show privacy alerts if sensitive fields detected
3. Privacy score should be visible and updating

**Test 3: Form Filling (Requires configuration)**
1. Navigate to Amazon sign-in page: https://amazon.com/ap/signin
2. Click "Fill Forms Privately" button OR type "fill form"
3. Should fill email field with your configured email
4. Check browser console (F12) for detailed logs

## 🔧 Troubleshooting

### Common Installation Issues

#### Issue: "Manifest file is missing or unreadable"
**Cause**: Wrong folder selected during installation
**Solution**:
- Ensure you selected the `chrome_extension` folder (not the parent directory)
- The selected folder must contain `manifest.json`
- Re-download if files are corrupted

#### Issue: Extension doesn't appear in toolbar
**Solutions**:
1. Check if extension is enabled: `chrome://extensions/` → PrivAgent → ensure "Enabled"
2. Pin extension: Click puzzle piece icon → Pin PrivAgent
3. Reload extension: `chrome://extensions/` → PrivAgent → Reload button

#### Issue: "This extension may have been corrupted"
**Solutions**:
1. Remove extension: `chrome://extensions/` → PrivAgent → Remove
2. Re-download extension files
3. Clear Chrome cache: Settings → Privacy → Clear browsing data
4. Reinstall using clean files

#### Issue: Form filling not working
**Common Causes & Solutions**:

1. **No form data configured**
   - Go to Privacy Settings → Agent Form Details
   - Fill in at least Name and Email
   - Save settings

2. **Content script not loaded**
   - Refresh the webpage
   - Check console for errors: F12 → Console tab
   - Look for "PrivAgent Content Script" messages

3. **Unsupported page**
   - PrivAgent works best on standard form pages
   - Some heavily customized forms may not be supported
   - Try on Amazon login page for testing

### Advanced Troubleshooting

#### Debug Mode
1. Go to Privacy Settings → Advanced → Enable "Debug Mode"
2. Open browser console (F12) → Console tab
3. Detailed logs will show extension behavior
4. Look for PrivAgent-prefixed messages

#### Reset Extension
If all else fails, reset PrivAgent:
1. `chrome://extensions/` → PrivAgent → Remove
2. Clear Chrome data: Settings → Privacy → Site Settings → View permissions and data stored across sites
3. Search for "chrome-extension" and clear PrivAgent data
4. Reinstall extension fresh

## 📱 Browser Support

### Supported Browsers
- ✅ **Google Chrome** 88+ (Primary support)
- ✅ **Microsoft Edge** 88+ (Chromium-based)
- ✅ **Brave Browser** 1.20+ (Chromium-based)
- ✅ **Vivaldi** 4.0+ (Chromium-based)

### Unsupported Browsers
- ❌ Firefox (Different extension system)
- ❌ Safari (Different extension system)
- ❌ Internet Explorer (Deprecated)

## 🔒 Security & Privacy

### During Installation
- PrivAgent requests minimal permissions
- No external network requests during setup
- All configuration data stored locally in Chrome

### Permission Requests
PrivAgent requests these Chrome permissions:
```json
{
  "activeTab": "Access current tab for form filling",
  "storage": "Store your settings locally",
  "scripting": "Execute form filling scripts",
  "contextMenus": "Add right-click privacy options"
}
```

### Host Permissions
- `<all_urls>`: Required for form filling on any website
- **Privacy Note**: PrivAgent can access page content but NEVER transmits data externally

## 📞 Getting Help

### If You Need Support

1. **Check Console Logs**
   - Press F12 → Console tab
   - Look for PrivAgent error messages
   - Take screenshot if reporting issues

2. **Community Support**
   - GitHub Issues: https://github.com/gokulkannanganesamoorthy/privagent-chrome-extension/issues
   - Include: Chrome version, OS, error messages, steps to reproduce

3. **Common Solutions**
   - 90% of issues resolved by reloading extension
   - Most form filling issues resolved by configuring Agent Form Details
   - Privacy dashboard issues often resolved by refreshing page

## ✅ Installation Complete

**You should now have:**
- ✅ PrivAgent installed and enabled in Chrome
- ✅ Privacy dashboard accessible via toolbar icon
- ✅ Form data configured for automated filling
- ✅ Privacy protection active on all websites
- ✅ Real-time privacy monitoring enabled

**Next Steps:**
1. Read the [USER_MANUAL.md](USER_MANUAL.md) for detailed usage instructions
2. Test form filling on Amazon or other login pages  
3. Explore privacy settings and customization options
4. Enjoy privacy-first web automation! 🛡️

---

**PrivAgent v2.0.0 - Privacy-First Web Automation**
*Enterprise-Grade Privacy Protection • Local Processing • Zero External Requests*