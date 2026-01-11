# API Configuration Guide

This document explains how API base URLs are configured across the frontend applications.

## Overview

All three frontend applications (admin, agent, source) now use a consistent API base URL configuration that works both in local development and production deployment.

## Configuration Priority

The API base URL is determined by the following priority:

1. **Environment Variable** (`VITE_API_BASE_URL`) - If set, this takes precedence
2. **Production Mode** - Uses empty string (relative paths) when built for production
3. **Development Mode** - Uses `http://localhost:8080` for local development

## Usage

### Local Development (Default)

No configuration needed! The app will automatically use `http://localhost:8080` when running in development mode.

```bash
# Just start the dev server
npm run dev
```

### Production with Reverse Proxy

When deploying behind a reverse proxy (like nginx), the app will automatically use relative paths (empty base URL). This means:

- API calls go to the same origin as the frontend
- Example: If frontend is at `https://example.com/admin`, API calls go to `https://example.com/auth/login`
- Your reverse proxy should route `/api/*` or `/*` to the backend server

### Custom Configuration

If you need to override the default behavior, create a `.env` file in the project root:

```env
# For production with custom API endpoint
VITE_API_BASE_URL=/api

# Or for a different server entirely
VITE_API_BASE_URL=https://api.example.com
```

## Implementation Details

### Configuration File

Each app has an `apiConfig.ts` file that handles the base URL logic:

- `gloriaconnect_admin/src/lib/apiConfig.ts`
- `gloriaconnect_agent/src/lib/apiConfig.ts`
- `gloriaconnect_source/src/lib/apiConfig.ts`

### Files Updated

All API clients have been updated to use the centralized configuration:

- `src/lib/http.ts` - Axios instance
- `src/lib/api.ts` - Axios instance (alternative)
- `src/api/http.ts` - HttpClient class (TypeScript)
- `src/api/http.js` - HttpClient class (JavaScript)

## Deployment Scenarios

### Scenario 1: Nginx Reverse Proxy

```nginx
# Frontend at /admin
location /admin {
    alias /var/www/admin/dist;
    try_files $uri $uri/ /admin/index.html;
}

# Backend at /api
location /api {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Set in `.env`:
```env
VITE_API_BASE_URL=/api
```

### Scenario 2: Same Origin (Recommended)

If your reverse proxy serves both frontend and backend from the same origin:

```nginx
# Serve frontend
location /admin {
    alias /var/www/admin/dist;
    try_files $uri $uri/ /admin/index.html;
}

# Proxy API requests to backend
location /auth {
    proxy_pass http://localhost:8080;
}
location /bookings {
    proxy_pass http://localhost:8080;
}
# ... etc for all API routes
```

No `.env` needed - empty string will be used automatically in production.

### Scenario 3: Separate Domain

If API is on a different domain:

```env
VITE_API_BASE_URL=https://api.example.com
```

**Note:** This may require CORS configuration on the backend.

## Verification

To verify which API base URL is being used:

1. Check the browser's Network tab - look at the request URLs
2. Check the Topbar badge (admin app) - shows current API base URL
3. Check Settings page - shows API base URL configuration

## Troubleshooting

### Issue: CORS errors in production

**Solution:** Ensure your reverse proxy is correctly routing requests. Use relative paths (empty `VITE_API_BASE_URL` in production).

### Issue: API calls going to wrong server

**Solution:** Set `VITE_API_BASE_URL` explicitly in your `.env` file.

### Issue: Works locally but not in production

**Solution:** Check that `import.meta.env.PROD` is `true` in production builds. Verify your build process isn't stripping environment variables.

