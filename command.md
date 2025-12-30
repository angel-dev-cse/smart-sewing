docker compose up -d
pnpm dev
pnpm prisma studio 
pnpm prisma db seed






pnpm prisma init

netstat -ano | findstr :3000

powershell -Command "Stop-Process -Id 117356 -Force"

PID=$(netstat -ano | grep ':3000' | awk '{print $5}' | head -n 1) && [ -n "$PID" ] && taskkill //PID $PID //F