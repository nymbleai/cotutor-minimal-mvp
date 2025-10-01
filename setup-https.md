# 🔒 HTTPS Setup for Local Development

Office.js requires HTTPS to work. Here's how to set it up quickly:

---

## ✅ Method 1: Using mkcert (Recommended)

### Step 1: Install mkcert

**Windows (PowerShell as Administrator):**

```powershell
# Using Chocolatey
choco install mkcert

# Or using Scoop
scoop bucket add extras
scoop install mkcert
```

**macOS:**

```bash
brew install mkcert
```

**Linux:**

```bash
# Debian/Ubuntu
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
sudo chmod +x /usr/local/bin/mkcert
```

### Step 2: Install Local Certificate Authority

```bash
mkcert -install
```

This creates a local CA that your system trusts.

### Step 3: Generate Certificate for localhost

```bash
cd cotutor-minimal-mvp
mkcert localhost 127.0.0.1 ::1
```

This creates two files:

- `localhost+2.pem` (certificate)
- `localhost+2-key.pem` (private key)

### Step 4: Update next.config.ts

Replace the contents of `next.config.ts` with:

```typescript
import type { NextConfig } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'

const nextConfig: NextConfig = {}

// Add HTTPS in development
if (process.env.NODE_ENV === 'development') {
  const devServer = nextConfig.devServer || {}
  try {
    devServer.https = {
      key: readFileSync(join(__dirname, 'localhost+2-key.pem')),
      cert: readFileSync(join(__dirname, 'localhost+2.pem'))
    }
    nextConfig.devServer = devServer
  } catch (error) {
    console.warn('⚠️  HTTPS certificates not found. Run: mkcert localhost 127.0.0.1 ::1')
  }
}

export default nextConfig
```

### Step 5: Restart Dev Server

```bash
npm run dev
```

Your app now runs at **`https://localhost:3000`** ✅

---

## ✅ Method 2: Using Node's Built-in HTTPS (Quick & Dirty)

If you can't install mkcert, use self-signed certificates:

### Step 1: Generate Self-Signed Certificate

```bash
# Windows (PowerShell) or macOS/Linux
cd cotutor-minimal-mvp
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

When prompted, just press Enter for all questions (or fill in localhost for Common Name).

### Step 2: Create Custom Server

Create `server.js`:

```javascript
const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, err => {
    if (err) throw err
    console.log(`> Ready on https://${hostname}:${port}`)
  })
})
```

### Step 3: Update package.json

```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start"
  }
}
```

### Step 4: Accept Self-Signed Certificate

When you visit `https://localhost:3000`:

1. You'll see a security warning
2. Click "Advanced"
3. Click "Proceed to localhost (unsafe)"

**Note:** You'll need to accept this in Word too when loading the add-in.

---

## ✅ Method 3: Using ngrok (Cloud Tunnel)

Skip local HTTPS and use a public URL:

### Step 1: Install ngrok

**Windows:**

```powershell
choco install ngrok
```

**macOS:**

```bash
brew install ngrok
```

Or download from: https://ngrok.com/download

### Step 2: Start Your HTTP Server

```bash
npm run dev
```

(Keep this running)

### Step 3: Create Tunnel

In a **new terminal**:

```bash
ngrok http 3000
```

You'll get a URL like: `https://abc123.ngrok.io`

### Step 4: Update manifest.xml

Replace all instances of `https://localhost:3000` with your ngrok URL:

```xml
<SourceLocation DefaultValue="https://abc123.ngrok.io"/>
<bt:Url id="Taskpane.Url" DefaultValue="https://abc123.ngrok.io"/>
<!-- etc... -->
```

### Step 5: Load in Word

Upload the updated manifest to Word Online.

**⚠️ Note:** Free ngrok URLs change each time you restart. Paid plans give you a fixed URL.

---

## 🧪 Testing Your HTTPS Setup

### 1. Check the URL

After setup, your dev server should say:

```
✓ Ready on https://localhost:3000
```

### 2. Visit in Browser

Go to `https://localhost:3000` - you should see the app with no certificate warnings (if using mkcert).

### 3. Check Console

Open DevTools (F12) and look for:

```
Office.js loaded successfully
```

### 4. Upload to Word

Update `manifest.xml` to use `https://localhost:3000` (if not already), then upload to Word Online.

---

## 🐛 Troubleshooting

### "Certificate not trusted" in Word

**Solution:** Make sure you ran `mkcert -install` to trust the local CA.

### "ERR_SSL_PROTOCOL_ERROR"

**Solution:** Check that your certificate files exist and paths are correct in `next.config.ts`.

### "Module not found: fs"

**Solution:** Update `next.config.ts` to use dynamic import:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

if (process.env.NODE_ENV === 'development') {
  try {
    const fs = require('fs')
    const path = require('path')

    nextConfig.devServer = {
      https: {
        key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem'))
      }
    }
  } catch (e) {
    console.warn('Could not load HTTPS certificates')
  }
}

export default nextConfig
```

### Port 3000 already in use

**Solution:** Kill the process or use a different port:

```bash
npm run dev -- -p 3001
```

Then update manifest.xml to use port 3001.

---

## 📝 Summary

**Easiest:** Method 1 (mkcert) - Trusted certificates, no warnings
**Fastest:** Method 2 (Self-signed) - Works but shows warnings
**Cloud:** Method 3 (ngrok) - Public URL, works everywhere

**Recommended:** Use **Method 1 (mkcert)** for the best development experience.

---

## ✅ After HTTPS is Working

1. ✅ Dev server runs on `https://localhost:3000`
2. ✅ No certificate warnings in browser
3. ✅ manifest.xml uses HTTPS URLs
4. ✅ Upload manifest to Word Online
5. ✅ Start typing and see keylogging work!

---

Need help? Check the troubleshooting section or see `QUICKSTART.md` for more details.
