# Read-Only Kubernetes/OpenShift Console

A production-grade, secure, read-only web console for Kubernetes and OpenShift clusters. Provides on-call and support teams with visibility into cluster state without exposing sensitive data.

## Features

- **Read-Only Access**: No write operations, no secrets exposure
- **Multi-Platform**: Supports both vanilla Kubernetes and OpenShift
- **Security First**: 3-layer defense-in-depth architecture
- **Modern Stack**: Fastify backend + React frontend with PatternFly UI
- **Real-Time**: Auto-refreshing resource views
- **Namespace Scoped**: Easy namespace switching
- **Production Ready**: Rate limiting, logging, error handling

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React SPA (Port 3000)                                  │ │
│  │  - Namespace selector                                   │ │
│  │  - Resource views (Pods, Deployments, Services)         │ │
│  └─────────────────────┬────────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTPS + Bearer Token
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Fastify API Server (Port 4000)                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auth Middleware (API Key for MVP)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Resource Filter Middleware                            │ │
│  │  - Blocks Secrets                                      │ │
│  │  - Allowlists CRDs                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Kubernetes Client (@kubernetes/client-node)           │ │
│  └─────────────────────┬──────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────────┘
                         │ K8s API (TLS + SA token)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Kubernetes/OpenShift Cluster                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  RBAC (Primary Security Layer)                         │ │
│  │  - Service Account: readonly-console-sa                │ │
│  │  - ClusterRole: read-only, NO secrets access           │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Security Design (Defense in Depth)

### Layer 1: Kubernetes RBAC (Primary Enforcement)
- Service account with read-only permissions
- Explicitly excludes Secrets, ServiceAccounts
- No write verbs (create, update, patch, delete)
- Even if backend is compromised, attackers cannot access secrets

### Layer 2: Backend Resource Filtering
- Middleware blocks sensitive resource types
- CRD allowlist validation
- Enforces read-only HTTP methods (GET only)
- Defense in depth if RBAC is misconfigured

### Layer 3: Response Sanitization
- Strips sensitive fields from responses
- Removes env vars, volume mounts, secret references
- Filters managedFields (reduce payload size)

### Authentication Flow (MVP)
- Simple API key authentication for development
- Designed for easy migration to OIDC/SSO
- Future: Keycloak/Red Hat SSO integration

## Quick Start

### Prerequisites
- Node.js 18+
- Kind (for local Kubernetes cluster)
- kubectl

### One-Command Setup
```bash
./scripts/quickstart.sh
```

This script will:
1. Create a Kind cluster
2. Deploy sample workloads
3. Apply RBAC manifests
4. Install all dependencies
5. Create environment files

### Start Development Servers
```bash
npm run dev
```

This runs both backend (port 4000) and frontend (port 3000) concurrently.

Or start individually:
```bash
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only
```

### Access the Console
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health

## Manual Setup

### 1. Create Kind Cluster
```bash
./scripts/setup-kind-cluster.sh
```

### 2. Install Dependencies
```bash
npm install              # Root
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Configure Environment

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Generate API key
echo "API_KEY=$(openssl rand -hex 32)" >> backend/.env
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

### 4. Start Servers
```bash
npm run dev
```

## Project Structure

```
readonly-k8s-console/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── kubernetes.ts          # K8s client + platform detection
│   │   │   └── allowed-resources.ts   # Resource allowlists
│   │   ├── middleware/
│   │   │   ├── auth.ts                # Mock auth (replace with SSO)
│   │   │   ├── resource-filter.ts     # Security filtering
│   │   │   └── error-handler.ts       # Centralized errors
│   │   ├── routes/
│   │   │   ├── namespaces.ts          # GET /api/namespaces
│   │   │   ├── pods.ts                # GET /api/pods
│   │   │   ├── deployments.ts         # GET /api/deployments
│   │   │   └── services.ts            # GET /api/services
│   │   ├── services/
│   │   │   └── kubernetes.service.ts  # K8s API wrapper
│   │   └── server.ts                  # Fastify entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NamespaceSelector.tsx
│   │   │   ├── PodsList.tsx
│   │   │   ├── DeploymentsList.tsx
│   │   │   └── ServicesList.tsx
│   │   ├── hooks/
│   │   │   └── useNamespace.tsx       # Namespace context
│   │   ├── services/
│   │   │   └── api.ts                 # Backend API client
│   │   └── App.tsx
│   └── package.json
├── k8s/
│   ├── namespace.yaml                 # console-system namespace
│   ├── serviceaccount.yaml            # Service account + token
│   └── rbac.yaml                      # ClusterRole + Binding
├── scripts/
│   ├── setup-kind-cluster.sh          # Setup Kind cluster
│   ├── cleanup-kind-cluster.sh        # Cleanup Kind cluster
│   └── quickstart.sh                  # One-command setup
└── README.md
```

## API Endpoints

### Backend API
```
GET  /health                            # Health check
GET  /info                              # Platform info

GET  /api/namespaces                    # List all namespaces
GET  /api/pods?namespace=<ns>           # List pods in namespace
GET  /api/pods/:namespace/:name         # Get specific pod
GET  /api/deployments?namespace=<ns>    # List deployments
GET  /api/deployments/:namespace/:name  # Get specific deployment
GET  /api/services?namespace=<ns>       # List services
GET  /api/services/:namespace/:name     # Get specific service
```

All endpoints require `Authorization: Bearer <API_KEY>` header.

## Testing

### Test Backend Connectivity
```bash
# Health check
curl http://localhost:4000/health

# Platform info
curl http://localhost:4000/info

# List namespaces (replace with your API key)
curl -H "Authorization: Bearer dev-api-key-change-in-production" \
  http://localhost:4000/api/namespaces

# List pods in demo namespace
curl -H "Authorization: Bearer dev-api-key-change-in-production" \
  http://localhost:4000/api/pods?namespace=demo
```

### Test RBAC Security
```bash
# This should fail - no secrets access
kubectl auth can-i get secrets --as=system:serviceaccount:console-system:readonly-console-sa
# Output: no

# This should succeed
kubectl auth can-i get pods --as=system:serviceaccount:console-system:readonly-console-sa
# Output: yes
```

### Test Resource Filtering
```bash
# Try to access secrets (should return 403)
curl -H "Authorization: Bearer dev-api-key-change-in-production" \
  http://localhost:4000/api/secrets?namespace=demo
```

## Production Deployment

### 1. Build for Production
```bash
npm run build
```

This builds both backend (to `backend/dist`) and frontend (to `frontend/dist`).

### 2. Deploy to Kubernetes

Update `k8s/deployment.yaml` with your image and deploy:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/serviceaccount.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml
```

### 3. Configure SSO (Production)

Replace mock auth with OIDC:
1. Uncomment OIDC setup in `backend/src/middleware/auth.ts`
2. Configure environment variables:
   ```
   OIDC_ISSUER_URL=https://keycloak.example.com/auth/realms/myrealm
   OIDC_CLIENT_ID=readonly-console
   OIDC_CLIENT_SECRET=<secret>
   SESSION_SECRET=<random-secret>
   ```
3. Update frontend login flow

## Security Considerations

### What Makes This Secure?

1. **RBAC Enforcement**: Primary security at K8s API level
2. **Defense in Depth**: Backend filtering as secondary protection
3. **Read-Only**: No write operations, immutable
4. **Secrets Protection**: Multiple layers prevent secrets access
5. **Token Scoping**: Backend uses dedicated service account
6. **HTTP-Only Cookies**: Prevents XSS token theft (when SSO added)
7. **Rate Limiting**: Prevents abuse
8. **Field Filtering**: Sensitive fields removed from responses

### Attack Vectors & Defenses

| Attack | Defense |
|--------|---------|
| Access secrets via API | RBAC denies + middleware blocks + no API endpoint |
| Modify resources | No write verbs in RBAC + middleware enforces GET only |
| RBAC privilege escalation | No access to Roles/RoleBindings in RBAC |
| Session hijacking | HTTP-only cookies (when SSO added) |
| XSS token theft | CSP headers + token in HTTP-only cookie |
| Enumerate sensitive CRDs | CRD allowlist in middleware |

## Troubleshooting

### Backend fails to connect to cluster
```bash
# Check kubeconfig
kubectl cluster-info

# Check service account (in-cluster mode)
kubectl get sa readonly-console-sa -n console-system

# Check RBAC
kubectl describe clusterrole readonly-console-role
```

### Frontend can't reach backend
- Check CORS settings in `backend/.env`
- Verify API_KEY matches in both `.env` files
- Check Vite proxy in `frontend/vite.config.ts`

### RBAC permission denied
```bash
# Check what the service account can do
kubectl auth can-i --list --as=system:serviceaccount:console-system:readonly-console-sa

# Re-apply RBAC manifests
kubectl apply -f k8s/rbac.yaml
```

## Roadmap

- [ ] Add SSO/OIDC authentication
- [ ] Pod logs viewer
- [ ] Resource detail pages
- [ ] Search and filtering
- [ ] Metrics integration (Prometheus)
- [ ] Events timeline
- [ ] Multi-cluster support
- [ ] Custom resource support (configurable CRDs)
- [ ] Export data (JSON/YAML)
- [ ] Dark mode

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test security implications
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
