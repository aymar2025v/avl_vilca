@echo off
cd /d "%~dp0"
echo Abre http://localhost:8000 en el navegador  (Ctrl+C para detener)
where py >nul 2>nul
if %errorlevel%==0 ( py -m http.server 8000 ) else ( python -m http.server 8000 )
