# Testing Guide

This document outlines how to test the Read-Only Kubernetes Console to verify security and functionality.

## Prerequisites

- Kind cluster running (`./scripts/setup-kind-cluster.sh`)
- Backend and frontend servers running (`npm run dev`)

## 1. Security Testing - RBAC Enforcement

### Test 1.1: Verify Service Account Cannot Access Secrets

```bash
# This should return "no" - service account is blocked from accessing secrets
kubectl auth can-i get secrets \
  --as=system:serviceaccount:console-system:readonly-console-sa

# Expected output: no

# This should also return "no"
kubectl auth can-i list secrets \
  --as=system:serviceaccount:console-system:readonly-console-sa

# Expected output: no
```

### Test 1.2: Verify Service Account Can Access Allowed Resources

```bash
# These should all return "yes"
kubectl auth can-i get pods \
  --as=system:serviceaccount:console-system:readonly-console-sa

kubectl auth can-i list deployments \
  --as=system:serviceaccount:console-system:readonly-console-sa

kubectl auth can-i get services \
  --as=system:serviceaccount:console-system:readonly-console-sa

kubectl auth can-i list namespaces \
  --as=system:serviceaccount:console-system:readonly-console-sa
```

### Test 1.3: Verify No Write Permissions

```bash
# All of these should return "no"
kubectl auth can-i create pods \
  --as=system:serviceaccount:console-system:readonly-console-sa

kubectl auth can-i delete deployments \
  --as=system:serviceaccount:console-system:readonly-console-sa

kubectl auth can-i patch services \
  --as=system:serviceaccount:console-system:readonly-console-sa

kubectl auth can-i update namespaces \
  --as=system:serviceaccount:console-system:readonly-console-sa
```

## 2. Backend API Testing

### Test 2.1: Health Check

```bash
curl http://localhost:4000/health

# Expected: {"status":"healthy","timestamp":"...","kubernetes":"connected"}
```

### Test 2.2: Platform Detection

```bash
curl http://localhost:4000/info

# Expected: {"platform":"kubernetes","isOpenShift":false,"capabilities":[...],"apiVersion":"v1"}
```

### Test 2.3: Authentication (API Key Required)

```bash
# Without API key - should fail
curl http://localhost:4000/api/namespaces

# Expected: {"error":"Unauthorized","message":"Missing Authorization header","statusCode":401}

# With correct API key - should succeed
API_KEY="dev-api-key-change-in-production"
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/namespaces

# Expected: {"items":[...],"count":...}
```

### Test 2.4: Resource Filter Middleware (Block Secrets)

```bash
API_KEY="dev-api-key-change-in-production"

# Try to access secrets via pods endpoint with kind parameter
curl -H "Authorization: Bearer $API_KEY" \
  "http://localhost:4000/api/pods?namespace=demo&kind=Secret"

# Expected: 403 Forbidden
# {"error":"Forbidden","message":"Access to resource type 'Secret' is not allowed","statusCode":403}
```

### Test 2.5: List Resources

```bash
API_KEY="dev-api-key-change-in-production"

# List namespaces
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/namespaces | jq

# List pods in demo namespace
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/pods?namespace=demo | jq

# List deployments in demo namespace
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/deployments?namespace=demo | jq

# List services in demo namespace
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/services?namespace=demo | jq
```

### Test 2.6: Non-Existent Namespace

```bash
API_KEY="dev-api-key-change-in-production"

curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/pods?namespace=nonexistent

# Expected: Error message about namespace not found
```

### Test 2.7: Invalid HTTP Methods (Write Operations Blocked)

```bash
API_KEY="dev-api-key-change-in-production"

# Try POST (should fail - only GET allowed)
curl -X POST -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/pods?namespace=demo

# Expected: 405 Method Not Allowed

# Try DELETE (should fail)
curl -X DELETE -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/pods?namespace=demo

# Expected: 405 Method Not Allowed
```

## 3. Frontend UI Testing

### Test 3.1: Load Application

1. Open browser to http://localhost:3000
2. Verify page loads without errors
3. Check browser console for errors (should be none)

### Test 3.2: Namespace Selector

1. Click namespace dropdown
2. Verify you see at least: `console-system`, `demo`, `default`, `kube-system`
3. Select `demo` namespace
4. Verify namespace changes in UI

### Test 3.3: Pods View

1. Navigate to "Pods" (should be default)
2. Select `demo` namespace
3. Verify you see 2 nginx pods and 1 redis pod
4. Check columns: Name, Status, Containers, Ready, Restarts, Created
5. Verify auto-refresh (watch Ready count for 10 seconds)

### Test 3.4: Deployments View

1. Click "Deployments" in sidebar
2. Select `demo` namespace
3. Verify you see `nginx` and `redis` deployments
4. Check Desired/Ready/Available counts match
5. Verify both deployments show Ready = Desired

### Test 3.5: Services View

1. Click "Services" in sidebar
2. Select `demo` namespace
3. Verify you see `nginx` and `redis` services
4. Check service types (ClusterIP)
5. Verify ports are displayed correctly

### Test 3.6: Error Handling

1. Select `demo` namespace
2. In backend terminal, stop the server (Ctrl+C)
3. Verify frontend shows error message
4. Restart backend
5. Verify frontend recovers and shows data again

## 4. End-to-End Flow Testing

### Test 4.1: Complete User Flow

1. Start fresh: `./scripts/setup-kind-cluster.sh`
2. Start servers: `npm run dev`
3. Open http://localhost:3000
4. Select `demo` namespace
5. View Pods → verify 3 pods visible
6. View Deployments → verify 2 deployments
7. View Services → verify 2 services
8. Switch to `kube-system` namespace
9. View Pods → verify system pods visible
10. Verify data auto-refreshes every 10 seconds

### Test 4.2: Scale Deployment and Verify Update

```bash
# Scale nginx deployment
kubectl scale deployment nginx -n demo --replicas=3

# Wait 10 seconds for auto-refresh in UI
# Verify:
# - Pods page shows 3 nginx pods (eventually)
# - Deployments page shows Desired: 3, Ready: 3
```

### Test 4.3: Create New Namespace and Verify

```bash
# Create new namespace
kubectl create namespace test

# Deploy sample app
kubectl create deployment hello --image=nginx -n test
kubectl expose deployment hello --port=80 -n test

# In UI:
# - Select "test" namespace from dropdown
# - Verify hello deployment visible
# - Verify hello pod visible
# - Verify hello service visible
```

## 5. Security Validation

### Test 5.1: Attempt Direct Secrets Access via K8s API

```bash
# Get service account token
SA_TOKEN=$(kubectl get secret readonly-console-sa-token -n console-system \
  -o jsonpath='{.data.token}' | base64 -d)

# Get API server URL
API_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')

# Try to list secrets (should fail with 403)
curl -k -H "Authorization: Bearer $SA_TOKEN" \
  $API_SERVER/api/v1/namespaces/demo/secrets

# Expected: 403 Forbidden
```

### Test 5.2: Verify No Secret Data in Pod Response

```bash
API_KEY="dev-api-key-change-in-production"

# Create a pod with a secret
kubectl create secret generic test-secret --from-literal=password=secret123 -n demo
kubectl run test-pod --image=nginx --env=PASSWORD=\$(cat /etc/secret/password) -n demo

# Fetch pod via API
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:4000/api/pods?namespace=demo | jq '.items[] | select(.name | startswith("test-pod"))'

# Verify response does NOT contain:
# - env variables
# - volume mounts
# - secret references
# Only safe fields like: name, status, containers[].image
```

### Test 5.3: RBAC Permission Matrix

Run the complete permission check:

```bash
#!/bin/bash
SA="system:serviceaccount:console-system:readonly-console-sa"

echo "=== SHOULD BE ALLOWED (YES) ==="
kubectl auth can-i get pods --as=$SA
kubectl auth can-i list deployments --as=$SA
kubectl auth can-i get services --as=$SA
kubectl auth can-i list namespaces --as=$SA

echo ""
echo "=== SHOULD BE DENIED (NO) ==="
kubectl auth can-i get secrets --as=$SA
kubectl auth can-i create pods --as=$SA
kubectl auth can-i delete deployments --as=$SA
kubectl auth can-i patch services --as=$SA
kubectl auth can-i get serviceaccounts --as=$SA
kubectl auth can-i escalate roles --as=$SA
```

## 6. Performance Testing

### Test 6.1: Large Namespace

```bash
# Create namespace with many pods
kubectl create namespace stress-test
for i in {1..50}; do
  kubectl create deployment test-$i --image=nginx --replicas=2 -n stress-test
done

# In UI:
# - Select stress-test namespace
# - Verify all 100 pods load (may take 10-30 seconds)
# - Check for performance issues
# - Monitor network tab for response times
```

### Test 6.2: Rate Limiting

```bash
API_KEY="dev-api-key-change-in-production"

# Send 150 requests rapidly (limit is 100/minute)
for i in {1..150}; do
  curl -H "Authorization: Bearer $API_KEY" \
    http://localhost:4000/api/namespaces &
done
wait

# Expected: Some requests return 429 Too Many Requests after 100 requests
```

## 7. Browser Testing

Test in multiple browsers:
- Chrome/Chromium
- Firefox
- Safari (macOS)
- Edge (Windows)

Verify:
- UI renders correctly
- Namespace selector works
- Tables display properly
- Auto-refresh functions
- No console errors

## Test Results Checklist

Mark each test as you complete it:

- [ ] RBAC prevents secrets access
- [ ] RBAC allows read access to pods, deployments, services
- [ ] RBAC denies write operations
- [ ] Backend health check responds
- [ ] Platform detection works
- [ ] Authentication required (401 without API key)
- [ ] Resource filter blocks secrets
- [ ] API returns valid JSON for all endpoints
- [ ] Write operations (POST, DELETE) are rejected
- [ ] Frontend loads without errors
- [ ] Namespace selector populates and switches
- [ ] Pods list displays correctly
- [ ] Deployments list displays correctly
- [ ] Services list displays correctly
- [ ] Auto-refresh works
- [ ] Error handling displays user-friendly messages
- [ ] Direct K8s API access to secrets fails
- [ ] Pod responses do not contain secret data
- [ ] Performance acceptable with 100+ pods
- [ ] Rate limiting enforces limits

## Troubleshooting Tests

### If RBAC tests fail:
```bash
# Re-apply RBAC
kubectl delete clusterrolebinding readonly-console-binding
kubectl delete clusterrole readonly-console-role
kubectl apply -f k8s/rbac.yaml
```

### If backend tests fail:
```bash
# Check logs
# Backend terminal should show request logs
# Look for error messages

# Verify K8s connectivity
kubectl cluster-info
kubectl get nodes
```

### If frontend tests fail:
```bash
# Check browser console for errors
# Check Network tab for failed requests
# Verify backend is running on port 4000
# Check CORS configuration in backend/.env
```

## Automated Testing (Future)

Future test automation could include:

- Jest/Vitest unit tests for backend services
- React Testing Library for frontend components
- Playwright/Cypress for E2E browser tests
- Security scanning with Snyk/Trivy
- Load testing with k6
