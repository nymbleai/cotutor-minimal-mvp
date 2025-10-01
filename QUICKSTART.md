# 🚀 Quick Start Guide

Get the KeyLogger MVP running in 5 minutes!

## 📦 What You Have

All the keylogging functionality has been extracted from the main project:

- ✅ `src/services/keylogger.ts` - Core keylogging engine
- ✅ `src/hooks/useOfficeJs.ts` - React hook wrapper
- ✅ `src/types/office.d.ts` - TypeScript types
- ✅ `src/app/page.tsx` - Beautiful UI with live stats
- ✅ `manifest.xml` - Word Add-in manifest

## 🏃 Running the App

### Step 1: Start Development Server

```bash
cd cotutor-minimal-mvp
npm run dev
```

The app will be available at `http://localhost:3000`

### Step 2: View in Browser (Standalone)

Open `http://localhost:3000` in your browser. You'll see:

- ❌ "Not in Word context" message
- ℹ️ Instructions on how to load in Word

**This is normal!** The app needs to run inside Microsoft Word to access documents.

### Step 3: Test in Microsoft Word

Choose one of these methods:

---

## 🎯 Method A: Word Online (Recommended for Testing)

This is the easiest way to test quickly:

1. **Enable HTTPS for localhost:**

   ```bash
   # Install mkcert (one-time setup)
   # Windows (with Chocolatey):
   choco install mkcert

   # macOS (with Homebrew):
   brew install mkcert

   # Install local CA
   mkcert -install

   # Generate certificate for localhost
   cd cotutor-minimal-mvp
   mkcert localhost
   ```

2. **Update next.config.ts:**

   ```typescript
   import type { NextConfig } from 'next'

   const nextConfig: NextConfig = {
     // Enable HTTPS for Office.js
     ...(process.env.NODE_ENV === 'development' && {
       server: {
         https: {
           key: './localhost-key.pem',
           cert: './localhost.pem'
         }
       }
     })
   }

   export default nextConfig
   ```

3. **Restart the dev server:**

   ```bash
   npm run dev
   ```

4. **Upload manifest to Word Online:**

   - Go to https://www.office.com
   - Open Word Online
   - Click **Insert** > **Add-ins** > **Upload My Add-in**
   - Upload the `manifest.xml` file
   - Click **Show Taskpane**

5. **Start typing!** The keylogger will activate automatically.

---

## 🎯 Method B: Office Add-in CLI (Recommended for Development)

Best for ongoing development:

1. **Install Office Add-in CLI:**

   ```bash
   npm install -g office-addin-dev-certs
   npm install -g office-addin-debugging
   ```

2. **Generate certificates:**

   ```bash
   npx office-addin-dev-certs install
   ```

3. **Update manifest** to use `https://localhost:3000`

4. **Sideload the add-in:**
   ```bash
   npx office-addin-debugging start manifest.xml desktop
   ```

This will automatically open Word and load your add-in!

---

## 🎯 Method C: Manual Sideload (Word Desktop - Windows)

1. **Place manifest in network share:**

   ```
   \\localhost\c$\Addins\manifest.xml
   ```

   Or use a local folder and configure as a trusted catalog.

2. **Configure trusted catalog in Word:**

   - File > Options > Trust Center > Trust Center Settings
   - Trusted Add-in Catalogs
   - Add the folder path
   - Check "Show in Menu"

3. **Open Word:**
   - Insert > My Add-ins
   - Select your add-in
   - Click "Add"

---

## ✅ Verify It's Working

Once loaded in Word, you should see:

1. **🟢 Status Indicator:**

   ```
   🔌 Office.js Status
   🟢 Ready - Word Context Detected
   ```

2. **🎮 Controls Active:**

   - Start/Stop buttons enabled
   - "🟢 Logging Active" status

3. **📊 Live Statistics:**

   - Total Changes count increasing as you type
   - CPS (characters per second) updating
   - Recent changes list populating

4. **📜 Changes Log:**
   - Each keystroke appears in the Recent Changes list
   - Shows type (addition/deletion), timestamp, and details

---

## 🐛 Troubleshooting

### "Office.js not available"

- Make sure you're running inside Word (not just a browser)
- Check that manifest.xml points to correct URL
- Verify HTTPS is working (Office.js requires HTTPS)

### "Cannot start logging"

- Ensure you have "ReadWriteDocument" permission in manifest
- Check browser console for errors
- Verify Office.js loaded successfully

### No changes detected

- Make sure logging is started (check status)
- Try typing more than a few characters
- Check console for polling errors

### HTTPS certificate errors

- Install mkcert and generate certificates
- Trust the local CA: `mkcert -install`
- Restart browser after installing certificates

---

## 📊 What Gets Tracked?

Every time you type in the Word document, the keylogger captures:

```typescript
{
  timestamp: Date,              // When the change occurred
  previousText: string,         // Document before
  currentText: string,          // Document after
  changeType: 'addition',       // Type of change
  changeLength: 25,             // Chars changed
  changePosition: 150,          // Where in doc
  cps: 5.2                      // Typing speed
}
```

---

## 🔧 Customization

### Change Polling Interval

Edit `src/services/keylogger.ts`:

```typescript
private readonly MIN_POLLING_INTERVAL = 500; // Poll every 0.5 seconds
```

### Store More Changes

```typescript
private readonly MAX_CHANGES = 100; // Keep last 100 changes
```

### Add Backend Integration

See `README.md` for instructions on adding a backend API to store logs.

---

## 📚 Next Steps

- ✅ Add backend API endpoint to store logs
- ✅ Implement periodic upload to server
- ✅ Add export functionality (JSON/CSV)
- ✅ Create admin dashboard to view all logs
- ✅ Add user authentication

---

## 💡 Tips

1. **Use Word Online** for fastest testing cycle
2. **Enable console** (F12) to see detailed logs
3. **Check Network tab** to verify Office.js loads
4. **Use HTTPS** - Office.js requires it
5. **Restart Word** if add-in doesn't load

---

**🎉 You're all set! Start typing in Word and watch the magic happen!**

For more details, see the full [README.md](README.md).
