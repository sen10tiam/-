#!/usr/bin/env bash
echo "===================================================================="
echo "       CHRONICLES OF ELDORIA : 2D RPG - ЗАПУСК ИГРЫ"
echo "===================================================================="
echo ""
echo "1) Автономный запуск в браузере без сервера (play_offline.html)"
echo "2) Полный запуск с Node.js (npm run dev)"
echo ""
read -p "Выберите вариант (1 или 2) [1]: " choice
choice=${choice:-1}

if [ "$choice" = "1" ]; then
  if which xdg-open > /dev/null; then
    xdg-open play_offline.html
  elif which open > /dev/null; then
    open play_offline.html
  else
    echo "Откройте play_offline.html в вашем браузере."
  fi
else
  if ! command -v node &> /dev/null; then
    echo "Node.js не установлен. Открываем play_offline.html..."
    open play_offline.html || xdg-open play_offline.html
    exit 0
  fi
  [ ! -d "node_modules" ] && npm install
  npm run dev
fi
