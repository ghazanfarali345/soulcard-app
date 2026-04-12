# Vercel Deployment Guide - Soul Card API with Swagger

## ✅ Deployment Status Check

### Fixed Issues:
- ✅ **vercel.json** - Updated to use built `dist/main.js` instead of source `src/main.ts`
- ✅ **Build Command** - Added explicit build command for TypeScript compilation
- ✅ **Swagger Implementation** - Fully incorporated with @nestjs/swagger
- ✅ **Dependencies** - All required packages installed
- ✅ **TypeScript Config** - Properly configured with outDir: `./dist`

---

## 📋 Pre-Deployment Checklist

### 1. **Ensure all dependencies are installed**
```bash
npm install
```

### 2. **Test build locally**
```bash
npm run build
```
Should create a `dist/` folder with compiled JavaScript.

### 3. **Test production build locally**
```bash
npm run build
npm run start:prod
```
Visit: `http://localhost:3000/api` - Swagger UI should load

---

## 🚀 Deploy to Vercel Steps

### Step 1: Connect GitHub Repository (if using Git)
```bash
git add .
git commit -m "Add Swagger and fix Vercel deployment config"
git push origin main
```

### Step 2: Configure Environment Variables on Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

| Variable | Value | Example |
|----------|-------|---------|
| `MONGODB_URI` | Your MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/soul_card_db` |
| `JWT_SECRET` | Your JWT secret key | `your-super-secret-jwt-key-min-32-chars` |
| `JWT_EXPIRATION` | Token expiration time | `3600` |
| `REFRESH_TOKEN_EXPIRATION` | Refresh token expiration | `604800` |
| `CORS_ORIGIN` | Frontend URL (optional) | `*` or `https://yourdomain.com` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port (Vercel sets this) | `3000` |

### Step 3: Deploy

**Option A: Deploy from Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Add environment variables
5. Click "Deploy"

**Option B: Deploy via CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🔗 Accessing Your Deployed API

Once deployed, Vercel will give you a URL like: `https://soul-card-api.vercel.app`

### Access Swagger UI:
```
https://soul-card-api.vercel.app/api
```

### API Endpoints:
- **Health Check**: `https://soul-card-api.vercel.app/`
- **Login**: `POST https://soul-card-api.vercel.app/auth/login`
- **Signup**: `POST https://soul-card-api.vercel.app/auth/signup`
- **Refresh Token**: `POST https://soul-card-api.vercel.app/auth/refresh`
- **Forgot Password**: `POST https://soul-card-api.vercel.app/auth/forgot-password`
- **Get Me**: `GET https://soul-card-api.vercel.app/auth/me` (requires JWT)

---

## 🧪 Test After Deployment

### 1. **Check Swagger UI**
```
https://your-domain.vercel.app/api
```
You should see:
- ✅ All 5 Auth endpoints
- ✅ Health check endpoint
- ✅ JWT authentication ready
- ✅ Interactive request/response examples

### 2. **Test with Postman/curl**
```bash
# Test health check
curl https://your-domain.vercel.app/

# Test signup
curl -X POST https://your-domain.vercel.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "termsAccepted": true
  }'
```

---

## ⚠️ Troubleshooting

### Issue: "Cannot find module" error
**Solution**: Run `npm install` and ensure all dependencies are listed in `package.json`

### Issue: Swagger UI loads but documentation is empty
**Solution**: 
- Ensure `@nestjs/swagger` is in production dependencies (not devDependencies)
- Current: ✅ In `dependencies` section

### Issue: Environment variables not loading
**Solution**:
- Add variables in Vercel Dashboard
- Restart deployment (Vercel → Redeploy)
- Check: Vercel Settings → Environment Variables

### Issue: CORS errors from frontend
**Solution**:
- Set `CORS_ORIGIN` environment variable to your frontend URL
- Current setup: `origin: process.env.CORS_ORIGIN || '*'` ✅

### Issue: MongoDB connection fails
**Solution**:
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist includes Vercel IP: `0.0.0.0/0`
- Test connection string locally first

### Issue: Build fails with TypeScript errors
**Solution**:
- Run `npm run build` locally to check for errors
- Required Node version: `v20+` (Vercel supports this)
- Current tsconfig: ✅ Configured correctly

---

## 📊 Current Configuration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Swagger** | ✅ Ready | @nestjs/swagger v11.2.7 + swagger-ui-express v5.0.1 |
| **vercel.json** | ✅ Fixed | Uses `dist/main.js`, explicit build command |
| **TypeScript** | ✅ Ready | Target: ES2023, OutDir: ./dist |
| **Dependencies** | ✅ Complete | All required packages installed |
| **Build Script** | ✅ Ready | `npm run build` compiles TypeScript |
| **JWT Auth** | ✅ Implemented | Bearer token support in Swagger |
| **CORS** | ✅ Configured | Dynamic origin from env variable |
| **MongoDB** | ✅ Ready | Requires MONGODB_URI env var |

---

## 📝 Important Notes for Production

1. **Never commit `.env` file** - Use Vercel environment variables instead
2. **Monitor cold starts** - Vercel serverless functions have cold start times
3. **Database connection pooling** - Consider MongoDB connection pooling for better performance
4. **Rate limiting** - Currently enabled, adjust in `.env` if needed
5. **Logs** - Check Vercel dashboard → Deployments → Log for debugging
6. **Custom domain** - Set up in Vercel Settings → Domains

---

## ✨ What You Can Do on Vercel Now

✅ Swagger UI fully functional at `/api`  
✅ All REST endpoints documented with examples  
✅ JWT authentication with Bearer tokens  
✅ Interactive testing directly from Swagger UI  
✅ Auto-scaling and unlimited deployments  
✅ CI/CD with GitHub integration  
✅ Free HTTPS for all deployments  

---

## 📞 Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- [Swagger Documentation](https://swagger.io/tools/swagger-ui/)

---

**Last Updated:** April 12, 2026  
**Status:** Ready for Production ✅
