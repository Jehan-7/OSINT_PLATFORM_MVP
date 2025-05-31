# CLI Process Management for Efficient Development

## 🚨 **TERMINATE IMMEDIATELY After Use:**

### Test Runners (Don't keep running)
```bash
# ❌ AVOID: Keeping test watchers open
npm test --watch
npm test -- --watch  
npx vitest --watch

# ✅ USE: Run once and terminate
npm test -- --run
npx vitest run
cd frontend && npm test -- --run

# 🔧 TERMINATE: If accidentally left running
Ctrl+C (Windows/Linux)
Cmd+C (Mac)
```

### Build Commands (Terminate after completion)
```bash
# ✅ These auto-terminate:
npm run build
npx tsc --noEmit

# ❌ If these hang, terminate:
Ctrl+C
```

### API Testing (Terminate immediately)
```bash
# ✅ These auto-terminate:
curl http://localhost:3001/api/health
powershell -Command "Invoke-RestMethod..."

# ❌ Don't leave curl sessions open
```

## ✅ **KEEP RUNNING During Development:**

### Development Servers (Keep running while coding)
```bash
# ✅ KEEP RUNNING: Frontend dev server
cd frontend && npm run dev
# Keep this running in dedicated terminal tab

# ✅ KEEP RUNNING: Backend services  
docker-compose up -d
# Runs in background, use -d flag
```

### Background Services (Keep running)
```bash
# ✅ KEEP RUNNING: Database & backend
docker-compose up -d

# 🔧 STOP when not developing:
docker-compose stop
docker-compose down
```

## 🎯 **Efficient Workflow Patterns:**

### Starting Development Session
```bash
# 1. Start backend services (keep running)
docker-compose up -d

# 2. Start frontend dev server (keep running)
cd frontend && npm run dev

# 3. Open new terminal for commands
# Use this for: git, tests, builds, curl
```

### Running Tests (Run & Close Pattern)
```bash
# ✅ Quick test verification:
cd frontend && npm test -- --run

# ✅ Specific test debugging:
cd frontend && npm test -- --run ComponentName.test.tsx

# ✅ Backend test verification:
cd backend && npm test

# ❌ AVOID: npm test --watch (unless actively debugging)
```

### Git Operations (Quick commands)
```bash
# ✅ Quick git commands (auto-terminate):
git status
git add .
git commit -m "message"
git push
```

## 🔧 **Process Cleanup Commands:**

### Check Running Processes
```bash
# Windows: Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill specific process by PID
taskkill /PID <process_id> /F
```

### Emergency Process Termination
```bash
# Terminal shortcuts:
Ctrl+C          # Terminate current command
Ctrl+Z          # Suspend (then type 'exit')

# Windows: Kill Node processes
taskkill /IM node.exe /F

# If terminal becomes unresponsive:
Alt+F4          # Close terminal window
```

## 📋 **Recommended Terminal Setup:**

### Terminal Tab Organization
```
Tab 1: "Frontend Dev"    → npm run dev (keep running)
Tab 2: "Commands"        → git, tests, builds (run & close)
Tab 3: "Backend Logs"    → docker-compose logs -f (optional)
```

### Command Patterns
```bash
# ✅ Efficient command sequence:
cd frontend && npm test -- --run && npm run build
# Runs tests, then builds, then terminates

# ❌ Inefficient:
npm test --watch
# Leaves test runner open indefinitely
```

## 🎯 **Sprint Development Best Practices:**

### Before Starting Work
```bash
# 1. Clean start
docker-compose up -d
cd frontend && npm run dev

# 2. Verify everything works
cd frontend && npm test -- --run
cd frontend && npm run build
```

### During Development
```bash
# 3. Quick test checks (run & close)
npm test -- --run

# 4. Commit frequently
git add . && git commit -m "message"
```

### End of Session
```bash
# 5. Clean shutdown
Ctrl+C                   # Stop frontend dev server
docker-compose stop      # Stop backend services
```

## ⚠️ **Performance Impact:**

### High Resource Usage (Terminate These):
- ❌ Test watchers (`npm test --watch`)
- ❌ Multiple build processes
- ❌ Unused development servers
- ❌ Docker containers when not developing

### Acceptable Resource Usage (Keep These):
- ✅ Single frontend dev server (`npm run dev`)
- ✅ Docker backend services (`docker-compose up -d`)
- ✅ One terminal for commands

## 🚀 **Quick Reference:**

### When in Doubt:
```bash
# Check what's running:
netstat -ano | findstr :3000

# Nuclear option (kill all Node):
taskkill /IM node.exe /F

# Restart clean:
docker-compose down && docker-compose up -d
cd frontend && npm run dev
```

**Golden Rule: Only keep services running that you're actively using for development. Everything else should run-and-terminate.**