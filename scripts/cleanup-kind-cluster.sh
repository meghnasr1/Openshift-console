#!/bin/bash
set -e

CLUSTER_NAME="readonly-console"

echo "======================================"
echo "Cleaning up Kind cluster"
echo "======================================"

if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Deleting cluster '${CLUSTER_NAME}'..."
    kind delete cluster --name "${CLUSTER_NAME}"
    echo "Cluster deleted successfully!"
else
    echo "Cluster '${CLUSTER_NAME}' not found"
fi
