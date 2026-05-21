# Deployment Configuration Guide

## Overview
This guide explains how to configure the backend and frontend for production deployment with:
- **Backend**: Deployed on Render at `https://armorify-ppe.onrender.com/`
- **Frontend**: Deployed on GitHub Pages at `https://ad-free.github.io/`

## Backend Configuration (Render)

### Environment Variables
Set the following environment variables in your Render service dashboard:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<your-secret-key>
JWT_SECRET_KEY=<your-jwt-secret-key>
ALLOWED_ORIGINS=["https://ad-free.github.io"]
```

### Important Notes on ALLOWED_ORIGINS
- The `ALLOWED_ORIGINS` variable must be a JSON array string
- For production: `["https://ad-free.github.io"]`
- For multiple origins: `["https://ad-free.github.io", "https://yourdomain.com"]`
- The CORS middleware will only allow requests from these origins

### CORS Setup
The backend automatically configures CORS based on the `ALLOWED_ORIGINS` environment variable set in settings. The configuration:
- ✅ Allows credentials (cookies, Authorization headers)
- ✅ Allows these HTTP methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- ✅ Exposes all response headers
- ✅ Sets max age of 3600 seconds

## Frontend Configuration (GitHub Pages)

### Build Environment
The GitHub Actions workflow automatically sets `VITE_API_BASE_URL` during the build:
```env
VITE_API_BASE_URL=https://armorify-ppe.onrender.com
```

This ensures the frontend connects to your Render backend URL.

### Runtime Behavior
- The frontend uses `VITE_API_BASE_URL` environment variable
- Falls back to `http://127.0.0.1:8000/api/v1` for local development
- All API calls are routed through this base URL

## Connectivity Flow

```
Frontend (GitHub Pages)
   ↓
   CORS preflight & requests
   ↓
Backend API (Render) - https://armorify-ppe.onrender.com
   ↓
   Validates origin against ALLOWED_ORIGINS
   ↓
   Returns 200 OK or 403 Forbidden
```

## GitHub Actions Workflow

The CI/CD pipeline now:
1. **Frontend build**: Sets `VITE_API_BASE_URL=https://armorify-ppe.onrender.com` ✅
2. **Frontend deployment**: Deploys to GitHub Pages
3. **Backend deployment**: Triggers Render rebuild via webhook

### Secrets Required
Ensure these secrets are configured in GitHub:
- `RENDER_SERVICE_ID`: Your Render backend service ID
- `RENDER_API_KEY`: Your Render API key for deployments

## Testing the Connection

1. **Check CORS headers**: Open browser DevTools and check the Network tab
2. **API calls should show**: 
   ```
   Request Headers:
   Origin: https://ad-free.github.io
   
   Response Headers:
   Access-Control-Allow-Origin: https://ad-free.github.io
   ```

## Troubleshooting

### "CORS error" / "Access-Control-Allow-Origin missing"
1. Verify `ALLOWED_ORIGINS` is set correctly in Render environment
2. Check the Origin header in request matches `ALLOWED_ORIGINS`
3. Restart the Render service after updating environment variables

### Frontend can't reach backend
1. Check `VITE_API_BASE_URL` is set to `https://armorify-ppe.onrender.com` in the build
2. Verify backend service is running on Render
3. Test the backend directly: `curl https://armorify-ppe.onrender.com/docs`

### Local Development
For local development, use environment-specific configuration:
- **Frontend**: `VITE_API_BASE_URL=http://localhost:8000`
- **Backend**: `ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]`

## Configuration Files
- Backend settings: `backend/app/core/settings.py`
- Backend main app: `backend/app/main.py` (CORS middleware)
- Frontend API client: `frontend/src/lib/api.ts`
- GitHub Actions: `.github/workflows/ci.yml`
