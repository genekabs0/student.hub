@echo off
echo Starting EDU App Server...
echo.
echo App will open at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause
