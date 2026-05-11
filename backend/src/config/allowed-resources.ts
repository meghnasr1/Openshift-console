/**
 * Security configuration for resource access control
 * Defense in depth: blocks sensitive resources even if RBAC is misconfigured
 */

export const BLOCKED_RESOURCE_KINDS = new Set([
  'Secret',
  'ServiceAccount',
  'TokenReview',
  'SelfSubjectAccessReview',
  'SelfSubjectRulesReview',
]);

export const ALLOWED_CORE_RESOURCES = new Set([
  'Pod',
  'Service',
  'ConfigMap',
  'PersistentVolumeClaim',
  'Namespace',
  'Node',
  'Event',
]);

export const ALLOWED_APPS_RESOURCES = new Set([
  'Deployment',
  'ReplicaSet',
  'StatefulSet',
  'DaemonSet',
]);

export const ALLOWED_NETWORKING_RESOURCES = new Set([
  'Ingress',
  'NetworkPolicy',
]);

export const ALLOWED_CRD_GROUPS = new Set([
  // OpenShift specific
  'route.openshift.io',
  'image.openshift.io',
  'build.openshift.io',
  'apps.openshift.io',

  // Monitoring
  'monitoring.coreos.com',

  // Service Mesh (Istio)
  'networking.istio.io',
  'security.istio.io',

  // Cert Manager
  'cert-manager.io',

  // Add more CRD groups as needed
]);

export const SENSITIVE_FIELD_PATTERNS = [
  'secret',
  'password',
  'token',
  'key',
  'credential',
  'auth',
];

/**
 * Check if a resource kind is blocked
 */
export function isResourceBlocked(kind: string): boolean {
  return BLOCKED_RESOURCE_KINDS.has(kind);
}

/**
 * Check if an API group is allowed for custom resources
 */
export function isApiGroupAllowed(apiGroup: string): boolean {
  return ALLOWED_CRD_GROUPS.has(apiGroup);
}

/**
 * Check if a core resource is allowed
 */
export function isCoreResourceAllowed(kind: string): boolean {
  return ALLOWED_CORE_RESOURCES.has(kind);
}

/**
 * Check if an apps resource is allowed
 */
export function isAppsResourceAllowed(kind: string): boolean {
  return ALLOWED_APPS_RESOURCES.has(kind);
}

/**
 * Check if a networking resource is allowed
 */
export function isNetworkingResourceAllowed(kind: string): boolean {
  return ALLOWED_NETWORKING_RESOURCES.has(kind);
}
