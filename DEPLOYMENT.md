# Hireflow Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas cluster (or hosted MongoDB)
- Clerk production account
- Hosting platform (Vercel, Render, Railway, etc.)

---

## 📦 Backend Deployment

### Option 1: Render.com (Recommended)

1. **Create new Web Service** on Render
2. **Connect GitHub Repository**
3. **Configure Build Settings:**
   ```
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm start
   ```

4. **Add Environment Variables:**
   ```
   CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   MONGO_URI=mongodb+srv://...
   PORT=3000
   NODE_ENV=production
   ```

5. **Deploy** - Render will build and start your backend

### Option 2: Railway.app

1. **New Project** → Import from GitHub
2. **Add Service** → Select backend folder
3. **Add Variables** (same as above)
4. **Deploy**

### Option 3: Fly.io

```bash
cd backend
fly launch
# Follow prompts, add env vars via fly secrets set
fly deploy
```

---

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended for React)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Add Environment Variables** in Vercel dashboard:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   VITE_API_URL=https://your-backend.onrender.com
   ```

4. **Redeploy** after adding env vars

### Option 2: Netlify

1. **Connect GitHub Repository**
2. **Build Settings:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

3. **Environment Variables:**
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   VITE_API_URL=https://your-backend-url.com
   ```

---

## 🔐 Clerk Production Setup

1. **Go to Clerk Dashboard** → Your Application
2. **Switch to Production Instance**
3. **Update API Keys:**
   - Frontend: Use production `publishable_key`
   - Backend: Use production `secret_key`

4. **Configure Domains:**
   - Add your production domain to allowed origins
   - Update redirect URLs

5. **Webhook Configuration (Optional but Recommended):**
   ```
   URL: https://your-backend.com/api/webhooks/clerk
   Events: user.created, user.updated
   ```

---

## 🗄️ MongoDB Atlas Setup

1. **Create Cluster** (Free M0 tier available)
2. **Database Access:** Create user with read/write permissions
3. **Network Access:** Add `0.0.0.0/0` (or whitelist your hosting IPs)
4. **Get Connection String:**
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
   ```

5. **Update Backend `.env`:**
   ```
   MONGO_URI=mongodb+srv://...
   ```

---

## ⚙️ Build Optimization

### Backend
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node src/index.ts"
  }
}
```

### Frontend
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Optimize Build:**
```bash
cd frontend
npm run build
# Output: dist/ folder (ready for deployment)
```

---

## 🔗 CORS Configuration (Production)

Update `backend/src/index.ts`:

```typescript
const allowedOrigins = [
  'https://your-frontend.vercel.app',
  'https://hireflow.com', // your custom domain
  process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : ''
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

## 📊 Monitoring & Logging

### Recommended Tools
- **Backend Logs**: Render/Railway built-in logs
- **Error Tracking**: Sentry.io
- **Uptime Monitoring**: UptimeRobot
- **Database Monitoring**: MongoDB Atlas Dashboard

### Add Sentry (Optional)

```bash
npm install @sentry/node
```

```typescript
// backend/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## 🧪 Pre-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Clerk production keys updated
- [ ] CORS origins include production URL
- [ ] Frontend `VITE_API_URL` points to production backend
- [ ] `.env` files NOT committed to Git
- [ ] Build completes without errors
- [ ] Test authentication flow in production
- [ ] Test file upload (resume) with size limits

---

## 🚨 Rollback Strategy

### If deployment fails:

1. **Check Logs:**
   ```bash
   # Render
   View logs in dashboard

   # Railway
   railway logs

   # Vercel
   vercel logs
   ```

2. **Revert to Previous Deployment:**
   - Render: Redeploy from previous commit
   - Vercel: Redeploy from deployments history

3. **Local Testing:**
   ```bash
   # Set NODE_ENV=production locally
   cd backend
   npm run build
   npm start
   ```

---

## 💰 Cost Estimates (Free Tiers)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Render** | ✅ Yes | 1 web service, 750 hrs/month |
| **Vercel** | ✅ Yes | 100 GB bandwidth, unlimited builds |
| **MongoDB Atlas** | ✅ Yes | 512 MB storage, shared cluster |
| **Clerk** | ✅ Yes | 10,000 MAUs, unlimited orgs |

**Total:** $0/month for small-scale projects

---

## 🌍 Custom Domain Setup

### Frontend (Vercel)
1. Go to Project Settings → Domains
2. Add your domain (e.g., `hireflow.com`)
3. Update DNS records with Vercel's nameservers
4. Wait for SSL certificate generation (~24 hours)

### Backend (Render)
1. Settings → Custom Domain
2. Add domain (e.g., `api.hireflow.com`)
3. Update DNS CNAME record
4. Auto-SSL enabled

---

## 📈 Scaling Considerations

### When to Upgrade:

**Free Tier Limits Reached:**
- MongoDB: 512 MB storage full
- Clerk: 10,000+ monthly active users
- Render: Need more than 750 hours/month

**Performance Issues:**
- API response time > 1 second
- Database queries slowing down
- Concurrent user load high

### Upgrade Options:
- **MongoDB**: Upgrade to M2/M5 cluster ($9-$25/month)
- **Render**: Paid plan for dedicated resources ($7-$25/month)
- **Clerk**: Pro plan ($25/month) for advanced features

---

## 🛡️ Security Hardening

### Production Security Checklist

- [ ] Use HTTPS everywhere (enforced by host)
- [ ] Helmet.js for HTTP headers:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```
- [ ] Rate limiting:
  ```typescript
  import rateLimit from 'express-rate-limit';
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use('/api/', limiter);
  ```
- [ ] Input validation & sanitization
- [ ] Regular dependency updates (`npm audit`)
- [ ] Environment secrets rotation

---

## 📞 Support & Debugging

### Common Production Issues

**Issue:** "Failed to fetch" errors  
**Solution:** Check CORS configuration, verify `VITE_API_URL`

**Issue:** Database connection timeouts  
**Solution:** Check MongoDB Atlas IP whitelist, verify connection string

**Issue:** Clerk authentication fails  
**Solution:** Ensure production keys match Clerk dashboard, check domain settings

---

**Deployment completed?** Test the full user journey:
1. Sign up as HR → Create company → Post job
2. Sign up as Student → Upload resume → View jobs

---

**Last Updated:** December 11, 2025  
**Deployment Version:** 1.0.0
