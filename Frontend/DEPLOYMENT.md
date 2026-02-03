# Frontend Deployment Guide

## How the Frontend Knows Which Backend to Use

The frontend gets its backend URL from the **environment variable** `VITE_API_URL`.

**Location:** `Frontend/src/services/api.js`
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
```

- **Development**: Uses `localhost:8080` (fallback)
- **Production**: Uses the value from `VITE_API_URL` environment variable

---

## Deployment Steps

### Step 1: Deploy Backend to Railway (Already Done)

After running `railway up`, get your backend URL:

```powershell
railway domain
```

Example output: `https://upstack-production.up.railway.app`

Your API will be at: `https://upstack-production.up.railway.app/api/v1`

---

### Step 2: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```powershell
   npm install -g vercel
   ```

2. **Navigate to frontend directory**:
   ```powershell
   cd Frontend
   ```

3. **Deploy with environment variable**:
   ```powershell
   vercel --prod
   ```

4. **During deployment**, Vercel will ask questions:
   - **Set up and deploy?** → Yes
   - **Which scope?** → Your account
   - **Link to existing project?** → No
   - **Project name?** → `upstack-frontend` (or your choice)
   - **Directory?** → `./` (current directory)
   - **Override settings?** → No

5. **Add environment variable in Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your `upstack-frontend` project
   - Go to **Settings** → **Environment Variables**
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://your-railway-backend-url.up.railway.app/api/v1`
     - **Environment**: Production, Preview, Development (select all)
   - Click **Save**

6. **Redeploy** to apply the environment variable:
   ```powershell
   vercel --prod
   ```

#### Option B: Using Vercel Dashboard (GitHub Integration)

1. **Push your code to GitHub**:
   ```powershell
   git add .
   git commit -m "Add environment variable support"
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)**
   - Click **Add New Project**
   - Import your GitHub repository
   - Select the `Frontend` directory as the root

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variable**:
   - In the deployment settings, add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://your-railway-backend-url.up.railway.app/api/v1`

5. **Deploy**

---

## Verification

After deployment, verify the connection:

1. **Open your Vercel URL** (e.g., `https://upstack-frontend.vercel.app`)
2. **Open Browser DevTools** (F12) → Console
3. **Try to register/login**
4. **Check Network tab** - you should see requests going to your Railway backend URL

---

## Local Development

For local development, the frontend will automatically use `localhost:8080` (the fallback).

If you want to test against the production backend locally:

1. **Create `.env` file** in `Frontend/` directory:
   ```
   VITE_API_URL=https://your-railway-backend-url.up.railway.app/api/v1
   ```

2. **Restart dev server**:
   ```powershell
   npm run dev
   ```

---

## Environment Variable Summary

| Environment | How to Set | Example Value |
|-------------|------------|---------------|
| **Local Dev** | `.env` file or fallback | `http://localhost:8080/api/v1` |
| **Vercel Production** | Vercel Dashboard → Settings → Environment Variables | `https://upstack-production.up.railway.app/api/v1` |
| **Build Time** | Set before running `npm run build` | Gets baked into the build |

---

## Troubleshooting

### Issue: Frontend still connects to localhost after deployment

**Solution**: Make sure you set the environment variable in Vercel **before** deploying, or redeploy after adding it.

### Issue: CORS errors in production

**Solution**: Update your backend CORS settings in `engine/internal/api/handlers.go`:

```go
func (s *Server) corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Allow your Vercel frontend domain
        w.Header().Set("Access-Control-Allow-Origin", "https://upstack-frontend.vercel.app")
        // Or allow all origins (less secure):
        // w.Header().Set("Access-Control-Allow-Origin", "*")
        
        w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-ID, Authorization")

        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

Then redeploy the backend:
```powershell
railway up
```

---

## Quick Deploy Commands

```powershell
# 1. Deploy backend
cd c:\Users\HP\Desktop\upstack-backend
railway up

# 2. Get backend URL
railway domain

# 3. Deploy frontend
cd Frontend
vercel --prod

# 4. Set environment variable in Vercel Dashboard
# VITE_API_URL = https://your-railway-url.up.railway.app/api/v1

# 5. Redeploy frontend to apply env var
vercel --prod
```

---

## Production URLs

After deployment, you'll have:

- **Frontend**: `https://upstack-frontend.vercel.app`
- **Backend**: `https://upstack-production.up.railway.app`
- **API Endpoint**: `https://upstack-production.up.railway.app/api/v1`

Share the frontend URL with users! 🚀
