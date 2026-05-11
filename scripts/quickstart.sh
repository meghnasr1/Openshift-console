#!/bin/bash
set -e

echo "======================================"
echo "Read-Only K8s Console - Quick Start"
echo "======================================"
echo ""

# Check if Kind cluster exists
if ! kind get clusters 2>/dev/null | grep -q "^readonly-console$"; then
    echo "Kind cluster not found. Setting up..."
    ./scripts/setup-kind-cluster.sh
else
    echo "Kind cluster already exists"
fi

echo ""
echo "Installing dependencies..."
echo ""

# Install root dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Setup backend .env if not exists
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo "API_KEY=$(openssl rand -hex 32)" >> backend/.env
fi

# Setup frontend .env if not exists
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "======================================"
echo "Setup complete!"
echo "======================================"
echo ""
echo "To start the development servers:"
echo "  npm run dev"
echo ""
echo "Or start individually:"
echo "  npm run dev:backend   (runs on http://localhost:4000)"
echo "  npm run dev:frontend  (runs on http://localhost:3000)"
echo ""
echo "Test the backend:"
echo "  curl http://localhost:4000/health"
echo ""
echo "Access the UI:"
echo "  http://localhost:3000"
echo ""
