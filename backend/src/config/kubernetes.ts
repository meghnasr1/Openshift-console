import * as k8s from '@kubernetes/client-node';
import { K8sClients, PlatformInfo } from '../types';

let k8sClients: K8sClients | null = null;
let platformInfo: PlatformInfo | null = null;

/**
 * Initialize Kubernetes client with auto-detection
 * Supports both in-cluster (service account) and local kubeconfig
 */
export function createK8sClient(): K8sClients {
  if (k8sClients) {
    return k8sClients;
  }

  const kc = new k8s.KubeConfig();

  // Auto-detect configuration
  if (process.env.KUBERNETES_SERVICE_HOST) {
    console.log('Detected in-cluster environment, using service account');
    kc.loadFromCluster();
  } else if (process.env.KUBECONFIG) {
    console.log(`Loading kubeconfig from: ${process.env.KUBECONFIG}`);
    kc.loadFromFile(process.env.KUBECONFIG);
  } else {
    console.log('Loading default kubeconfig from ~/.kube/config');
    kc.loadFromDefault();
  }

  const currentContext = kc.getCurrentContext();
  console.log(`Using Kubernetes context: ${currentContext}`);

  // Create API clients
  k8sClients = {
    coreV1Api: kc.makeApiClient(k8s.CoreV1Api),
    appsV1Api: kc.makeApiClient(k8s.AppsV1Api),
    customObjectsApi: kc.makeApiClient(k8s.CustomObjectsApi),
    networkingV1Api: kc.makeApiClient(k8s.NetworkingV1Api),
  };

  return k8sClients;
}

/**
 * Detect platform type (OpenShift vs vanilla Kubernetes)
 */
export async function detectPlatform(): Promise<PlatformInfo> {
  if (platformInfo) {
    return platformInfo;
  }

  const clients = createK8sClient();
  const capabilities: string[] = [];
  let isOpenShift = false;
  let version = 'unknown';

  try {
    // Try to access OpenShift-specific API
    const routeApiGroup = 'route.openshift.io';
    const routeApiVersion = 'v1';

    try {
      await clients.customObjectsApi.listClusterCustomObject(
        routeApiGroup,
        routeApiVersion,
        'routes',
        undefined,
        undefined,
        undefined,
        undefined,
        1 // Limit to 1 to minimize overhead
      );
      isOpenShift = true;
      capabilities.push('routes', 'projects', 'imagestreams', 'builds');
      console.log('Detected OpenShift platform');
    } catch (error: any) {
      if (error.statusCode !== 404) {
        console.log('Not an OpenShift cluster or routes API not available');
      }
    }

    // Get Kubernetes version
    try {
      const versionInfo = await clients.coreV1Api.readNamespace('kube-system');
      if (versionInfo.body.metadata?.labels?.['kubernetes.io/metadata.name']) {
        version = 'kubernetes';
      }
    } catch (error) {
      console.warn('Failed to detect Kubernetes version:', error);
    }

    // Check for common features
    try {
      await clients.networkingV1Api.listIngressForAllNamespaces(undefined, undefined, undefined, undefined, 1);
      capabilities.push('ingress');
    } catch (error) {
      // Ingress not available
    }

    platformInfo = {
      isOpenShift,
      version: isOpenShift ? 'OpenShift' : version,
      capabilities,
    };

    console.log('Platform detection complete:', platformInfo);
    return platformInfo;
  } catch (error) {
    console.error('Platform detection failed:', error);
    // Default to vanilla Kubernetes
    platformInfo = {
      isOpenShift: false,
      version: 'unknown',
      capabilities: [],
    };
    return platformInfo;
  }
}

/**
 * Get cached Kubernetes clients
 */
export function getK8sClients(): K8sClients {
  if (!k8sClients) {
    return createK8sClient();
  }
  return k8sClients;
}

/**
 * Get cached platform info
 */
export function getPlatformInfo(): PlatformInfo | null {
  return platformInfo;
}

/**
 * Reset clients (useful for testing)
 */
export function resetClients(): void {
  k8sClients = null;
  platformInfo = null;
}

/**
 * Health check: verify Kubernetes API connectivity
 */
export async function checkK8sConnection(): Promise<boolean> {
  try {
    const clients = getK8sClients();
    await clients.coreV1Api.listNamespace(undefined, undefined, undefined, undefined, 1);
    return true;
  } catch (error) {
    console.error('Kubernetes API connection check failed:', error);
    return false;
  }
}
