# 🚀 BlitzProof Free Deployment Guide

## 📋 **Prerequisites**
- GitHub account
- Git installed locally
- Node.js 18+ installed

## 🆓 **Free Deployment Stack**

### **Frontend**: Vercel (Free)
### **Backend**: Render (Free)
### **Database**: Supabase (Free)
### **File Storage**: Supabase Storage (Free)

---

## 🎯 **Step 1: Prepare Your Code**

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/blitzproof.git
git push -u origin main
```

### 1.2 Update Environment Variables

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_APP_URL=https://your-frontend-url.vercel.app
```

**Backend (.env)**
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres:[SUPABASE_PASSWORD]@db.[SUPABASE_PROJECT_REF].supabase.co:5432/postgres
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-url.vercel.app
```

---

## 🎯 **Step 2: Deploy Database (Supabase)**

### 2.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (free)
3. Create new project
4. Note your project URL and database password

### 2.2 Get Database Connection String
1. Go to Settings → Database
2. Copy the connection string
3. Replace `[YOUR-PASSWORD]` with your database password

### 2.3 Run Database Migration
```bash
# In backend directory
npm install
npm run migrate
```

---

## 🎯 **Step 3: Deploy Backend (Render)**

### 3.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Verify your email

### 3.2 Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `blitzproof-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 3.3 Add Environment Variables
In Render dashboard, add these environment variables:
```
NODE_ENV=production
PORT=4000
DATABASE_URL=your-supabase-connection-string
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-frontend-url.vercel.app
REDIS_URL=redis://localhost:6379
```

### 3.4 Get Backend URL
- Render will provide a URL like: `https://your-app-name.onrender.com`
- Copy this URL for frontend configuration

---

## 🎯 **Step 4: Deploy Frontend (Vercel)**

### 4.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### 4.2 Configure Frontend
1. Set root directory to `frontend`
2. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   NEXT_PUBLIC_APP_URL=https://your-frontend-url.vercel.app
   ```
3. Deploy

### 4.3 Custom Domain (Optional)
- Vercel allows free custom domains
- Add your domain in Vercel dashboard

---

## 🎯 **Step 5: Update CORS Settings**

### 5.1 Update Backend CORS
In `backend/src/index.ts`, update the allowed origins:
```typescript
const allowedOrigins = [
  'https://your-frontend-url.vercel.app',
  'https://your-custom-domain.com', // if you have one
  process.env.FRONTEND_URL
].filter(Boolean)
```

### 5.2 Redeploy Backend
- Render will automatically redeploy when you push changes

---

## 🎯 **Step 6: Test Deployment**

### 6.1 Health Check
- Backend: `https://your-backend-url.onrender.com/health`
- Should return: `{"status":"ok","uptime":123.45,...}`

### 6.2 Frontend Test
- Visit your Vercel URL
- Test wallet connection
- Test contract scanning

### 6.3 Database Test
- Check Supabase dashboard
- Verify tables are created
- Test a scan to ensure data is saved

---

## 🔧 **Troubleshooting**

### Common Issues:

**1. CORS Errors**
- Check allowed origins in backend
- Ensure frontend URL is correct

**2. Database Connection**
- Verify Supabase connection string
- Check if database is accessible

**3. Build Errors**
- Check Node.js version (18+ required)
- Verify all dependencies are installed

**4. Environment Variables**
- Ensure all required env vars are set
- Check for typos in URLs

**5. Render Sleep Issues**
- Free tier sleeps after 15 minutes
- First request may take 30-60 seconds
- Consider upgrading to paid plan for no sleep

---

## 📊 **Free Tier Limits**

### **Vercel (Frontend)**
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ SSL certificates
- ⚠️ 100GB bandwidth/month
- ⚠️ Serverless function timeout (10s)

### **Render (Backend)**
- ✅ 750 hours/month (31 days)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Sleeps after 15 minutes inactivity
- ⚠️ 512MB RAM, shared CPU
- ⚠️ Cold starts (30-60 seconds)

### **Supabase (Database)**
- ✅ 500MB database
- ✅ 50MB file storage
- ⚠️ 50,000 monthly users
- ⚠️ 500,000 API requests/month

---

## 🚀 **Scaling Up (When You Have Budget)**

### **Upgrade Path:**
1. **Render Starter** ($7/month) - No sleep, better performance
2. **Vercel Pro** ($20/month) - More bandwidth, longer functions
3. **Supabase Pro** ($25/month) - More storage, higher limits
4. **Custom VPS** ($5-20/month) - Full control

---

## 📞 **Support**

### **Free Resources:**
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### **Community:**
- GitHub Issues
- Stack Overflow
- Discord communities

---

**🎉 Congratulations! Your BlitzProof platform is now live for free!** 