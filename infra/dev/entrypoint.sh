#!/bin/sh

echo "Starting listambot service..."

# Start Xvfb for puppeteer (if needed)
if command -v Xvfb >/dev/null 2>&1; then
  echo "Starting Xvfb..."
  Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp -nolisten unix &
  export DISPLAY=:99
fi

npm run start:dev
