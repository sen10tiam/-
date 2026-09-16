@echo off
title Chronicles of Eldoria - Launcher
chcp 65001 >nul
cls

echo ====================================================================
echo        CHRONICLES OF ELDORIA : 2D RPG - ЗАПУСК ИГРЫ
echo ====================================================================
echo.
echo 1. Быстрый запуск игры без сервера и интернета (play_offline.html)
echo 2. Полный запуск с сервером разработки (npm run dev)
echo.

set /p choice="Выберите вариант (1 или 2) [по умолчанию 1]: "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo Запуск автономной версии в браузере...
    start play_offline.html
    exit
)

if "%choice%"=="2" (
    echo.
    echo Проверка наличия Node.js...
    where node >nul 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo [!] Node.js не найден в системе.
        echo Открываем автономную версию play_offline.html...
        timeout /t 3 >nul
        start play_offline.html
        exit
    )
    
    if not exist node_modules (
        echo.
        echo Установка зависимостей (npm install)...
        call npm install
    )
    
    echo.
    echo Запуск сервера Vite на http://localhost:3000...
    start http://localhost:3000
    call npm run dev
)
