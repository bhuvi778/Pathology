@echo off
cd /d g:\Pathology
git add -A
git commit -m "feat: implement dynamic test parameters feature"
echo.
echo Latest commit:
git log --oneline -1
echo.
echo Git status:
git status
pause
