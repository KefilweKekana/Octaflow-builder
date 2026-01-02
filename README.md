# ERPFlow Builder - Deployment Guide

Visual app builder for ERPFlow mobile app. Design your mobile app layout without coding!

## 🚀 Quick Deploy to Vercel (Recommended - 5 minutes)

### Step 1: Upload to GitHub

1. **Create a new GitHub repository:**
   - Go to https://github.com/new
   - Repository name: `erpflow-builder`
   - Public or Private: Your choice
   - Click "Create repository"

2. **Upload files:**
   - Download and extract this folder
   - Open terminal/command prompt
   - Navigate to the folder:
     ```bash
     cd path/to/erpflow-builder-deploy
     ```
   - Initialize git:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/erpflow-builder.git
     git push -u origin main
     ```

   **OR use GitHub Desktop (easier):**
   - Open GitHub Desktop
   - File → Add Local Repository
   - Select this folder
   - Publish repository

### Step 2: Deploy to Vercel

1. **Go to:** https://vercel.com/

2. **Sign up/Login** with GitHub

3. **Click "New Project"**

4. **Import your GitHub repository:**
   - Select `erpflow-builder`
   - Click "Import"

5. **Configure project:**
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Click "Deploy"**

7. **Wait 2-3 minutes** - Vercel will build and deploy

8. **Get your URL:** `https://erpflow-builder-xxx.vercel.app`

9. **Done!** Open the URL and start designing!

---

## 💻 Run Locally (For Testing)

### Prerequisites
- Node.js 16+ installed (https://nodejs.org/)

### Steps

1. **Navigate to folder:**
   ```bash
   cd erpflow-builder-deploy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Go to: http://localhost:5173
   - Builder will open!

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🎨 How to Use ERPFlow Builder

### 1. Login
- Enter your ERPNext URL (e.g., `https://yoursite.erpnext.com`)
- Enter your API Key and API Secret
- Click "Connect"

### 2. Design Home Page
- Click "DocTypes" tab (grid icon)
- Browse all your ERPNext doctypes
- Click + to add cards to home page
- Go to "Home" tab
- Drag & drop to reorder cards
- Click on card labels to rename them

### 3. Customize Theme
- Click "Theme" tab (settings icon)
- Pick colors with color pickers
- See live preview on the right

### 4. Export Configuration
- Click "Export Config" button (top right)
- Downloads `erpflow-config.json`
- Upload this file to your ERPNext:
  - Go to ERPNext → Upload
  - Upload to `/files/erpflow-config.json`
  - OR upload to Firebase Storage

### 5. Flutter App Auto-Updates!
- Your mobile app will fetch the new config
- Users see changes within 5 minutes
- No app rebuild needed!

---

## 📁 Project Structure

```
erpflow-builder-deploy/
├── src/
│   ├── App.jsx          # Main builder application
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind CSS
├── index.html           # HTML entry
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── README.md            # This file
```

---

## 🔧 Troubleshooting

### Build fails on Vercel
- Make sure all files are uploaded to GitHub
- Check that `package.json` exists
- Verify Vite is selected as framework preset

### Can't connect to ERPNext
- Verify ERPNext URL is correct (include https://)
- Check API credentials are correct
- Make sure your ERPNext site is accessible from the internet

### Exported config doesn't update app
- Make sure config.json is uploaded to correct location
- Check Flutter app is fetching from correct URL
- Wait 5 minutes for background update
- Or restart the mobile app

---

## 🎯 Next Steps

After deploying the builder:

1. **Phase 2:** Update Flutter app to read config
2. **Phase 3:** Add form designer (configure which fields to show)
3. **Phase 4:** Add navigation customization
4. **Phase 5:** Add push notification triggers

---

## 📝 License

MIT

---

## 🆘 Need Help?

If you encounter issues during deployment, check:
- Vercel documentation: https://vercel.com/docs
- Vite documentation: https://vitejs.dev/
