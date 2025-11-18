# Fix "Failed to fetch" Error in Codespaces

## The Problem
The frontend is trying to connect to `http://localhost:5002`, but in Codespaces, the backend runs on a forwarded HTTPS URL.

## Quick Fix Steps

### Step 1: Check if Backend is Running
In your Codespaces terminal, check if the backend is running:
```bash
cd datanexus-dashboard/server
npm run dev
```

You should see: `Events inquiry API running on http://localhost:XXXX`

### Step 2: Find Backend Forwarded URL
1. Look at the **"Ports"** tab in Codespaces (bottom panel)
2. Find the port where your backend is running (usually 5002 or 5000)
3. Copy the forwarded URL (looks like: `https://curly-halibut-XXXX-XXXX.app.github.dev`)

### Step 3: Update .env File
In the Codespaces terminal:
```bash
cd datanexus-dashboard
# Replace with your actual backend forwarded URL from Step 2
echo "VITE_API_BASE_URL=https://curly-halibut-XXXX-XXXX.app.github.dev" > .env
```

### Step 4: Restart Frontend
1. Stop the frontend (Ctrl+C in the terminal where it's running)
2. Restart it:
```bash
cd datanexus-dashboard
npm run dev
```

### Step 5: Verify
1. Check the browser console (F12) - you should no longer see "Failed to fetch"
2. Try logging in again with: `admin` / `admin123`

## Alternative: Use Vite Proxy (If Backend is on Same Codespace)
If both frontend and backend are in the same Codespace, you can also use the Vite proxy by updating `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5002', // Backend's internal port
        changeOrigin: true,
      },
    },
  },
})
```

Then restart the frontend. This works because Vite's proxy runs server-side and can access localhost.

## Still Not Working?

1. **Check backend terminal**: Make sure you see "Events inquiry API running on..."
2. **Check Ports tab**: Both frontend and backend should have forwarded ports
3. **Check .env file**: Run `cat datanexus-dashboard/.env` to verify the URL
4. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. **Check browser console**: Look for specific error messages

