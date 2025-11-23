# Running DataNexus Dashboard in GitHub Codespaces

This guide will help you set up and run the DataNexus Dashboard in GitHub Codespaces.

## Step 1: Open Repository in Codespaces

1. Go to your repository: https://github.com/DevakiTechData/MRP-DATA-NEXUS-ANALYTICS
2. Click the green **"Code"** button
3. Select the **"Codespaces"** tab
4. Click **"Create codespace on main"** or **"+"** to create a new codespace
5. Wait for the codespace to initialize (this may take 1-2 minutes)

## Step 2: Install Dependencies

Once your codespace is ready, open a terminal and run:

```bash
# Install frontend dependencies (use --legacy-peer-deps for React 19 compatibility)
npm install --legacy-peer-deps

# Install backend dependencies
cd server
npm install
cd ..
```

> **Important:** The `--legacy-peer-deps` flag is required because `react-simple-maps@3.0.0` doesn't officially support React 19 yet, but it works fine with this flag.

> **Note:** If you're using the devcontainer configuration (`.devcontainer/devcontainer.json`), dependencies will be installed automatically when the codespace is created, but you may need to run `npm install --legacy-peer-deps` manually if there are peer dependency conflicts.

## Step 3: Configure Environment Variables

### For Backend (Optional)

The backend will use default values if no `.env` file is present:
- `PORT=5002` (default)
- `JWT_SECRET=change-me` (default)
- `JWT_EXPIRY=2h` (default)

To customize, create `server/.env`:
```bash
cd server
cat > .env << EOF
PORT=5002
JWT_SECRET=your-secure-secret-key-here
JWT_EXPIRY=2h
EOF
cd ..
```

### For Frontend (Required for Codespaces)

1. **Start the backend server first** (see Step 4)
2. Go to the **"Ports"** tab in Codespaces (usually at the bottom of the screen)
3. **Make port 5002 Public:**
   - Find port **5002** (Backend API) in the list
   - Right-click on port 5002 → **"Change Port Visibility"** → **"Public"**
   - This is **critical** - the port must be public for the frontend to access it
4. Find the forwarded URL for port **5002** (Backend API)
   - It will look like: `https://your-codespace-XXXX-5002.app.github.dev`
   - Note: The URL format is `app.github.dev`, not `preview.app.github.dev`
5. Create `.env` file in the root directory:

```bash
cat > .env << EOF
VITE_API_BASE_URL=https://your-codespace-XXXX-5002.app.github.dev
EOF
```

Replace `your-codespace-XXXX-5002` with the actual URL shown in the Ports tab.

**Example:**
```bash
cat > .env << EOF
VITE_API_BASE_URL=https://zany-space-adventure-7vpjv4qvj7972wq5q-5002.app.github.dev
EOF
```

> **Important:** Do NOT include a trailing slash (`/`) at the end of the URL. The code automatically handles URL normalization, but it's best practice to omit the trailing slash.

## Step 4: Start the Backend Server

Open a terminal and run:

```bash
cd server
npm run dev
```

Or if you don't have nodemon:
```bash
cd server
node index.js
```

You should see:
```
Events inquiry API running on http://0.0.0.0:5002
Server accessible on http://localhost:5002
CORS enabled for all origins
```

**Keep this terminal open!**

### Verify Backend is Running

Test the backend locally:
```bash
curl http://localhost:5002/api/health
```

Should return: `{"status":"ok"}`

Test the external URL (after making port public):
```bash
curl https://your-codespace-XXXX-5002.app.github.dev/api/health
```

Should return: `{"status":"ok"}` (not a 302 redirect)

## Step 5: Start the Frontend Server

Open a **new terminal** (Terminal → New Terminal) and run:

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

> **Note:** If you see an error about `react-is` not being found, run:
> ```bash
> npm install react-is --legacy-peer-deps
> ```
> Then restart the frontend server.

## Step 6: Configure Port Visibility

**CRITICAL STEP:** Before accessing the application, ensure both ports are set to **Public**:

1. Go to the **"Ports"** tab in Codespaces
2. For **Port 5002** (Backend API):
   - Right-click → **"Change Port Visibility"** → **"Public"**
   - This allows the frontend to make API requests
3. For **Port 5173** (Frontend):
   - Right-click → **"Change Port Visibility"** → **"Public"**
   - This allows you to access the frontend in your browser

> **Why Public?** GitHub Codespaces port forwarding defaults to private/authenticated. Making ports public allows:
> - Frontend to communicate with backend (CORS)
> - External browser access to the application
> - No authentication redirects blocking requests

## Step 7: Access the Application

1. **Check the "Ports" tab** in Codespaces
2. You should see two forwarded ports:
   - **Port 5002** (Backend API) - Status: **Public** ✅
   - **Port 5173** (Frontend Vite) - Status: **Public** ✅
3. Click the **globe icon** 🌐 next to port **5173** to open the frontend in your browser
4. The application should load at the forwarded URL
5. **Hard refresh** the page: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to clear any cached errors

## Step 8: Login

Use the demo credentials from `server/data/users.json`:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Alumni | `alumni` | `alumni123` |
| Employer | `employer` | `employer123` |

After logging in, you'll be redirected based on your role:
- **Admin**: Can access all dashboards, admin console, and portals
- **Alumni**: Can access Alumni Portal, Gallery, Contact
- **Employer**: Can access Employer Portal, Gallery, Contact

## Troubleshooting

### CORS Errors (Most Common Issue)

**Symptoms:** "Failed to fetch" error, CORS policy errors in browser console

**Solution:**
1. **Make port 5002 Public** (most important!)
   - Go to "Ports" tab
   - Right-click port 5002 → "Change Port Visibility" → "Public"
2. **Verify backend is running:**
   ```bash
   curl http://localhost:5002/api/health
   ```
   Should return: `{"status":"ok"}`
3. **Test external URL:**
   ```bash
   curl https://your-codespace-XXXX-5002.app.github.dev/api/health
   ```
   Should return: `{"status":"ok"}` (not a 302 redirect)
4. **Verify CORS headers:**
   ```bash
   curl -H "Origin: https://your-codespace-XXXX-5173.app.github.dev" \
     https://your-codespace-XXXX-5002.app.github.dev/api/health \
     -i | grep -i "access-control"
   ```
   Should show: `access-control-allow-origin: *` or your origin
5. **Restart backend server** after making port public
6. **Hard refresh browser:** `Ctrl+Shift+R` (or `Cmd+Shift+R`)

### Ports Not Forwarding Automatically

If ports don't forward automatically:
1. Go to the **"Ports"** tab
2. Right-click on the port number
3. Select **"Change Port Visibility"** → **"Public"**
4. Click the **globe icon** to open

### Backend Returns 302 Redirect

**Symptom:** `curl` to external URL returns `HTTP/2 302` with `location: https://github.dev/pf-signin`

**Solution:** Port is not public. Make port 5002 public in the Ports tab.

### Backend Not Accessible

1. Make sure the backend is running (check terminal for errors)
2. Verify the port is forwarded and **Public** (check Ports tab)
3. Test locally first: `curl http://localhost:5002/api/health`
4. Update `.env` with the correct backend URL from the Ports tab
5. Restart the frontend server after updating `.env`

### Frontend Can't Connect to Backend

1. Check that `VITE_API_BASE_URL` in `.env` matches the backend URL in the Ports tab
2. Make sure the backend server is running
3. **Ensure port 5002 is Public** (not Private)
4. Restart the frontend server after changing `.env`
5. Hard refresh the browser

### Dependency Installation Errors

**Error:** `ERESOLVE could not resolve` or `react-is not found`

**Solution:**
```bash
# Install with legacy peer deps flag
npm install --legacy-peer-deps

# If react-is is missing specifically
npm install react-is --legacy-peer-deps

# Reinstall all dependencies if needed
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Backend dependencies
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

### "Failed to fetch" Error on Login

**Causes:**
1. Port 5002 is not public
2. Backend server is not running
3. `.env` file has wrong URL
4. CORS headers not being sent

**Solution:**
1. Make port 5002 public
2. Verify backend is running: `curl http://localhost:5002/api/health`
3. Check `.env` file has correct URL
4. Restart both servers
5. Hard refresh browser

## Quick Start Script

You can also create a startup script to run both servers:

```bash
# Create start.sh
cat > start.sh << 'EOF'
#!/bin/bash

# Start backend in background
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
EOF

chmod +x start.sh
./start.sh
```

## Using Multiple Terminals

For better control, use separate terminals:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Stopping the Servers

- Press `Ctrl+C` in each terminal to stop the servers
- Or close the terminal tabs

## Next Steps

- Explore the **Alumni Dashboard** (`/alumni`) as admin
- Explore the **Employer Dashboard** (`/employer`) as admin
- Test the **Alumni Portal** (`/alumni-portal`) as alumni
- Test the **Employer Portal** (`/employer-portal`) as employer
- Check the **Admin Console** (`/admin`) for data management

For more information, see the [README.md](README.md) file.

