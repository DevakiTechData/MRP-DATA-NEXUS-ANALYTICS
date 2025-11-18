# GitHub Codespaces Setup Guide

This guide helps you run DataNexus in GitHub Codespaces without hardcoding ports.

## Quick Start

### Step 1: Start the Backend

```bash
cd datanexus-dashboard/server
npm install
npm run dev
```

**What happens:**
- The server starts and Codespaces automatically forwards the port
- Check the **"Ports"** tab in Codespaces (bottom panel) to see the forwarded URL
- It will look like: `https://your-codespace-XXXX.app.github.dev`
- **Copy this URL** - you'll need it for the frontend

### Step 2: Configure Frontend Environment

```bash
cd datanexus-dashboard
# Replace XXXX with the actual port number from Step 1
echo "VITE_API_BASE_URL=https://your-codespace-XXXX.app.github.dev" > .env
```

### Step 3: Start the Frontend

```bash
cd datanexus-dashboard
npm install
npm run dev
```

**What happens:**
- The frontend starts and Codespaces automatically forwards the port
- Check the **"Ports"** tab again to see the frontend URL
- Click on the forwarded URL to open the application

## Troubleshooting

### "Failed to fetch" or Login Not Working

1. **Check backend is running**: Look for "Events inquiry API running on..." in the backend terminal
2. **Verify .env file**: Make sure `datanexus-dashboard/.env` contains the correct backend forwarded URL
3. **Check Ports tab**: Both backend and frontend should show forwarded ports
4. **Restart frontend**: After updating `.env`, restart the frontend dev server

### Port Already in Use

- Codespaces handles port forwarding automatically
- If you see port conflicts, just restart the server - Codespaces will assign a new port
- Update your `.env` file with the new forwarded URL

### Can't Find the Ports Tab

- In Codespaces, look at the bottom panel
- Click on the "Ports" tab
- If not visible, go to View → Terminal → Ports

## Test Credentials

- **Admin**: `admin` / `admin123`
- **Alumni**: `alumni` / `alumni123`
- **Employer**: `employer` / `employer123`

## Notes

- Ports are automatically assigned by Codespaces - no need to specify them
- The `.env` file should contain the **forwarded HTTPS URL**, not `localhost`
- Both servers must be running for the application to work
- The frontend needs the backend URL in `.env` to make API calls

