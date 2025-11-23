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
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

> **Note:** If you're using the devcontainer configuration (`.devcontainer/devcontainer.json`), dependencies will be installed automatically when the codespace is created.

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
2. Check the **"Ports"** tab in Codespaces (usually at the bottom of the screen)
3. Find the forwarded URL for port **5002** (Backend API)
   - It will look like: `https://your-codespace-XXXX-5002.preview.app.github.dev`
4. Create `.env` file in the root directory:

```bash
cat > .env << EOF
VITE_API_BASE_URL=https://your-codespace-XXXX-5002.preview.app.github.dev
EOF
```

Replace `your-codespace-XXXX-5002` with the actual URL shown in the Ports tab.

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
Server running on port 5002
Data directory: /workspaces/MRP-DATA-NEXUS-ANALYTICS/server/data
```

**Keep this terminal open!**

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

## Step 6: Access the Application

1. **Check the "Ports" tab** in Codespaces
2. You should see two forwarded ports:
   - **Port 5002** (Backend API) - Click the globe icon to open
   - **Port 5173** (Frontend) - Click the globe icon to open
3. Click the **globe icon** 🌐 next to port **5173** to open the frontend in your browser
4. The application should load at the forwarded URL

## Step 7: Login

Use the demo credentials from `server/data/users.json`:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Alumni | `alumni` | `alumni123` |
| Employer | `employer` | `employer123` |

## Troubleshooting

### Ports Not Forwarding Automatically

If ports don't forward automatically:
1. Go to the **"Ports"** tab
2. Right-click on the port number
3. Select **"Change Port Visibility"** → **"Public"**
4. Click the **globe icon** to open

### Backend Not Accessible

1. Make sure the backend is running (check terminal for errors)
2. Verify the port is forwarded (check Ports tab)
3. Update `.env` with the correct backend URL from the Ports tab
4. Restart the frontend server after updating `.env`

### Frontend Can't Connect to Backend

1. Check that `VITE_API_BASE_URL` in `.env` matches the backend URL in the Ports tab
2. Make sure the backend server is running
3. Restart the frontend server after changing `.env`

### Dependencies Not Installed

If you see module errors:
```bash
# Reinstall frontend dependencies
rm -rf node_modules package-lock.json
npm install

# Reinstall backend dependencies
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

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

