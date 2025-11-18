# GitHub Pages Deployment Fix

## Issues Fixed

1. **Base Path Configuration**: Added base path to `vite.config.js` for GitHub Pages subdirectory deployment
2. **React Router Basename**: Updated `App.jsx` to use `import.meta.env.BASE_URL` for proper routing
3. **Build Directory**: Fixed GitHub Actions workflow to build from `datanexus-dashboard/` directory

## Important Notes

### Base Path
- If your repository is deployed at `https://username.github.io/datanexus-dashboard/`, the base path is `/datanexus-dashboard/`
- If deployed at root (`https://username.github.io/`), change base to `/` in `vite.config.js`

### Backend API
**GitHub Pages is static hosting - the backend API will NOT work on GitHub Pages.**

You have two options:

#### Option 1: Deploy Backend Separately (Recommended)
1. Deploy backend to Render, Railway, Fly.io, or similar
2. Set `VITE_API_BASE_URL` in GitHub Secrets to your backend URL
3. Update the workflow to use the secret

#### Option 2: Disable Authentication for Demo
If you only want to showcase the frontend:
1. Comment out authentication checks
2. Make dashboards accessible without login
3. Note: Admin features won't work without backend

## Current Configuration

The workflow now:
- Builds from `datanexus-dashboard/` directory
- Sets `GITHUB_PAGES=true` during build
- Uses base path `/datanexus-dashboard/` for assets and routing
- Uploads `datanexus-dashboard/dist` as the artifact

## Testing Locally

To test the GitHub Pages build locally:

```bash
cd datanexus-dashboard
GITHUB_PAGES=true npm run build
npm run preview
```

This will build with the base path and you can verify routing works correctly.

## Next Steps

1. **Set Backend URL** (if deploying backend separately):
   - Go to Repository Settings → Secrets and variables → Actions
   - Add secret: `VITE_API_BASE_URL` = `https://your-backend-url.com`

2. **Verify Base Path**:
   - Check your GitHub Pages URL
   - If it's `username.github.io/datanexus-dashboard/`, current config is correct
   - If it's `username.github.io/`, change base to `/` in `vite.config.js`

3. **Push to Main**:
   - Commit these changes
   - Push to main branch
   - GitHub Actions will automatically deploy

## Troubleshooting

### Routes Not Working
- Check browser console for 404 errors
- Verify `404.html` exists in `public/` folder
- Ensure `index.html` has the SPA redirect script

### Assets Not Loading
- Check if base path matches your GitHub Pages URL
- Verify assets are in `public/` folder (they'll be copied to `dist/`)

### API Calls Failing
- This is expected - backend needs separate deployment
- Set `VITE_API_BASE_URL` secret if backend is deployed
- Or disable authentication for frontend-only demo

