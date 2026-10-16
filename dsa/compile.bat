
@echo off
cd /d "%~dp0"

g++ -std=c++17 -Wall -Wextra -pedantic ^
src/main.cpp ^
src/Train.cpp ^
src/Station.cpp ^
src/Booking.cpp ^
src/Search.cpp ^
src/Sorting.cpp ^
src/Reservation.cpp ^
src/FileManager.cpp ^
-o RailwayReservationSystem.exe

if errorlevel 1 (
    echo.
    echo Compilation failed. Check the errors above.
    pause
    exit /b 1
)

echo.
echo Compilation successful!
echo Starting Railway Reservation System...
echo.

RailwayReservationSystem.exe
