# Troubleshooting Admin UI Errors

## Common Errors and Solutions

### Error: `GET http://localhost:5174/src/main.tsx net::ERR_ABORTED 404`
**Cause**: Browser cache or service worker trying to load wrong file.

**Solution**:
1. **Hard refresh your browser**: 
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

2. **Clear browser cache**:
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Clear service workers**:
   - Open DevTools → Application tab
   - Click "Service Workers" in the left sidebar
   - Click "Unregister" for any registered service workers
   - Refresh the page

### Error: `GET http://localhost:5174/@vite-plugin-pwa/pwa-entry-point-loaded net::ERR_ABORTED 404`
**Cause**: Stale service worker or browser cache referencing a PWA plugin that doesn't exist.

**Solution**:
1. Clear service workers (see above)
2. Clear browser cache
3. Restart the dev server:
   ```bash
   # Stop the server (Ctrl+C)
   # Clear Vite cache
   rm -rf node_modules/.vite .vite
   # Restart
   npm run dev
   ```

### Error: `manifest.webmanifest:1 Manifest: Line: 1, column: 1, Syntax error.`
**Cause**: Browser trying to load a manifest file that doesn't exist or is malformed.

**Solution**:
1. Clear browser cache and service workers (see above)
2. Check if there's a manifest link in `index.html` - there shouldn't be one
3. If the error persists, check browser DevTools → Application → Manifest and clear any cached manifest

## Quick Fix (All Errors)

Run these commands in order:

```bash
# 1. Stop the dev server (Ctrl+C if running)

# 2. Clear all caches
cd "Admin - UI"
rm -rf node_modules/.vite .vite dist

# 3. Restart the dev server
npm run dev
```

Then in your browser:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage" → "Clear site data"
4. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

## Verification

After clearing cache, you should see:
- ✅ No 404 errors in the console
- ✅ The app loads correctly
- ✅ No manifest errors
- ✅ No PWA plugin errors

