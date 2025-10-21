@echo off
echo Pushing to GitHub...
cd /d "%~dp0"

git init
git add .
git commit -m "Clean UI: Collapsible sidebar for PC, hamburger menu for mobile"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/genekabs0/student.hub.git
git push -u origin main --force

echo.
echo Done! Check https://genekabs0.github.io/student.hub/ in 1-2 minutes
pause
