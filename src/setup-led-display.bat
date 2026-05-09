@echo off

REM Windows-specific first-run setup for timer system
REM @author Philip Taylor
REM @editor Jesse Phillips
REM @version 0.0.1

echo ==========================================
echo   LED Display first-run setup
echo ==========================================
echo.
echo This needs to be run as Administrator.
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator.
    echo Right-click it and choose "Run as administrator".
    pause
    exit /b 1
)

echo.
echo Removing any old 5500 URL reservations...
netsh http delete urlacl url=http://+:5500/ >nul 2>&1

echo.
echo Adding URL reservation for port 5500...
netsh http add urlacl url=http://+:5500/ user=Everyone

echo.
echo Removing any old firewall rule...
netsh advfirewall firewall delete rule name="LED Display 5500" >nul 2>&1

echo.
echo Adding Windows Firewall rule for TCP 5500...
netsh advfirewall firewall add rule name="LED Display 5500" dir=in action=allow protocol=TCP localport=5500

echo.
echo Current URL reservations involving 5500:
netsh http show urlacl | findstr 5500

echo.
echo Setup complete.
pause