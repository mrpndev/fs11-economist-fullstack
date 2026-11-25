#!/usr/bin/env bash

export NVM_DIR="$HOME/.nvm"

if [ -s "$NVM_DIR/nvm.sh" ]; then
	source "$NVM_DIR/nvm.sh"
	nvm use default
fi

set -euo pipefail

APP_DIR="/var/www/economist"

echo "starting deploy..."

cd "$APP_DIR"

echo "Installing server dependencies..."

cd server
npm ci

echo "Installing client dependencies..."

cd ../client
npm ci

echo "Build React app..."
npm run build

echo "restart Express server..."
cd ../server
pm2 restart economist-server --update-env

echo "Deployment successful"
