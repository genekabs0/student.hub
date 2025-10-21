@echo off
echo Setting up Git and pushing to GitHub...
cd /d "%~dp0"

:: Configure Git (one time)
git config --global user.email "genesiskabs0.0@gmail.com"
git config --global user.name "Genesis Kabs"

:: Push to GitHub
git init
git add .
git commit -m "Clean UI: Collapsible sidebar for PC, hamburger menu for mobile"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/genekabs0/student.hub.git
git push -u origin main --force

echo.
echo Done! Check https://genekabs0.github.io/student.hub/ in 1-2 minutes
echo.
echo Don't forget to add "genekabs0.github.io" to Firebase authorized domains!
pause
