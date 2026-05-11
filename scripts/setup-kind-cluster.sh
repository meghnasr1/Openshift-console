#!/bin/bash
set -e

echo "======================================"
echo "Setting up Kind cluster for testing"
echo "======================================"

CLUSTER_NAME="readonly-console"

# Check if Kind is installed
if ! command -v kind &> /dev/null; then
    echo "Error: kind is not installed"
    echo "Install with: brew install kind (macOS) or go install sigs.k8s.io/kind@latest"
    exit 1
fi

# Check if cluster already exists
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Cluster '${CLUSTER_NAME}' already exists"
    read -p "Delete and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing cluster..."
        kind delete cluster --name "${CLUSTER_NAME}"
    else
        echo "Using existing cluster"
        exit 0
    fi
fi

# Create Kind cluster
echo "Creating Kind cluster..."
kind create cluster --name "${CLUSTER_NAME}" --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
EOF

echo ""
echo "Cluster created successfully!"
echo ""
echo "Setting kubectl context..."
kubectl cluster-info --context "kind-${CLUSTER_NAME}"

echo ""
echo "Deploying sample workloads..."
kubectl create namespace demo --dry-run=client -o yaml | kubectl apply -f -
kubectl create deployment nginx --image=nginx:latest -n demo --replicas=2
kubectl expose deployment nginx --port=80 -n demo
kubectl create deployment redis --image=redis:latest -n demo
kubectl expose deployment redis --port=6379 -n demo

echo ""
echo "Applying RBAC manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/serviceaccount.yaml
kubectl apply -f k8s/rbac.yaml

echo ""
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=nginx -n demo --timeout=60s || true

echo ""
echo "======================================"
echo "Setup complete!"
echo "======================================"
echo ""
echo "Cluster name: ${CLUSTER_NAME}"
echo "Context: kind-${CLUSTER_NAME}"
echo ""
echo "Sample workloads deployed in 'demo' namespace:"
kubectl get all -n demo
echo ""
echo "RBAC setup in 'console-system' namespace:"
kubectl get sa,clusterrole,clusterrolebinding -n console-system -l app=readonly-console
echo ""
echo "Next steps:"
echo "1. cd backend && npm install && cp .env.example .env"
echo "2. cd frontend && npm install"
echo "3. npm run dev (from root directory)"
echo ""
