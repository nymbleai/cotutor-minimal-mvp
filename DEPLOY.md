# 🚀 Deployment Guide - Render

Quick guide to deploy your Office.js KeyLogger MVP to Render.

---

## ✅ Pre-Deployment Checklist

All set! The app is ready to deploy:

- ✅ ESLint errors fixed
- ✅ TypeScript types properly configured
- ✅ Production build tested
- ✅ `render.yaml` configuration file added
- ✅ Download JSON button added

---

## 🚀 Deploy to Render

### Step 1: Push to GitHub

```bash
cd cotutor-minimal-mvp

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Office.js KeyLogger MVP"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/office-keylogger-mvp.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. **Go to Render:** https://render.com/
2. **Sign up/Login** (you can use GitHub login)
3. **Click "New +"** → **"Web Service"**
4. **Connect your GitHub repository**
5. **Select the repository** you just created
6. Render will auto-detect the `render.yaml` configuration!

**Or manually configure:**

- **Name:** `office-keylogger-mvp`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** Free

7. **Click "Create Web Service"**

### Step 3: Wait for Deployment

Render will:

- Install dependencies
- Build your Next.js app
- Start the server
- Give you a URL like: `https://office-keylogger-mvp.onrender.com`

This takes 2-5 minutes for the first deploy.

---

## 🔧 Update manifest.xml

Once deployed, update your `manifest.xml` with the Render URL:

```xml
<!-- Replace all instances of localhost:3000 with your Render URL -->
<SourceLocation DefaultValue="https://office-keylogger-mvp.onrender.com"/>
<bt:Url id="Taskpane.Url" DefaultValue="https://office-keylogger-mvp.onrender.com"/>
<bt:Url id="Commands.Url" DefaultValue="https://office-keylogger-mvp.onrender.com"/>
<bt:Url id="GetStarted.LearnMoreUrl" DefaultValue="https://office-keylogger-mvp.onrender.com"/>
<bt:Image id="Icon.16x16" DefaultValue="https://office-keylogger-mvp.onrender.com/next.svg"/>
<bt:Image id="Icon.32x32" DefaultValue="https://office-keylogger-mvp.onrender.com/next.svg"/>
<bt:Image id="Icon.80x80" DefaultValue="https://office-keylogger-mvp.onrender.com/next.svg"/>
```

---

## 🧪 Test in Word

1. **Upload updated manifest** to Word Online
2. **Open the add-in** from Insert > Add-ins
3. **Start typing** in Word
4. **Watch the keylogging work!** 🎉
5. **Download JSON** to save your data

---

## 📝 Important Notes

### Free Tier Limitations

- **Cold starts:** App spins down after 15 min of inactivity
- **First request slow:** Takes 30-60 seconds to wake up
- **15 hours/month limit** (plenty for testing)

### Upgrade to Keep Always On

If you need it always running, upgrade to:

- **Starter Plan:** $7/month (always on, no cold starts)

---

## 🔄 Updating Your Deployment

After making changes:

```bash
git add .
git commit -m "Update: description of changes"
git push
```

Render automatically redeploys on push! 🚀

---

## 🐛 Troubleshooting

### Build fails on Render

- Check the build logs in Render dashboard
- Make sure all dependencies are in `package.json`
- Test `npm run build` locally first

### App shows 404

- Make sure the build succeeded
- Check Render logs for errors
- Verify the URL is correct

### Office.js not loading

- Check browser console for errors
- Make sure manifest.xml has correct HTTPS URLs
- Verify Render app is running (not in sleep mode)

### Keylogging not working

- Check that Office.js status shows "Ready"
- Verify you're typing in the Word document
- Look at browser console for errors

---

## 📊 Monitoring

In Render dashboard you can see:

- **Logs:** Real-time application logs
- **Metrics:** CPU, memory usage
- **Deploys:** History of all deployments

---

## 🎉 Success!

Once deployed:

- ✅ Your app has a permanent HTTPS URL
- ✅ No need for local HTTPS setup
- ✅ Works in Word Online and Desktop
- ✅ Can share with others via manifest file
- ✅ Automatic redeployments on git push

---

**Need help?** Check Render docs: https://render.com/docs
