@echo off
cd /d "C:\Users\COM\Desktop\SpinningNeedle"
git add .
git commit -m "📝 Auto-push %date% %time%"
git push origin main
