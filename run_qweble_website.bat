@echo off
title QWeble.com Landing Page & Portal
cd /d "%~dp0"

echo [QWEBLE.COM] Starting QWeble Web Platform...
echo Opening in your browser at http://localhost:5173
start http://localhost:5173
npm run dev
