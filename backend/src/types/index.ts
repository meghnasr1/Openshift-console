import { FastifyRequest } from 'fastify';

export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  createdAt: string;
  labels?: Record<string, string>;
  containers: ContainerInfo[];
}

export interface ContainerInfo {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
}

export interface DeploymentInfo {
  name: string;
  namespace: string;
  replicas: {
    desired: number;
    ready: number;
    available: number;
  };
  createdAt: string;
  labels?: Record<string, string>;
  selector?: Record<string, string>;
}

export interface ServiceInfo {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: ServicePort[];
  createdAt: string;
  labels?: Record<string, string>;
  selector?: Record<string, string>;
}

export interface ServicePort {
  name?: string;
  port: number;
  targetPort: string | number;
  protocol: string;
}

export interface NamespaceInfo {
  name: string;
  status: string;
  createdAt: string;
  labels?: Record<string, string>;
}

export interface CustomResourceInfo {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  spec?: unknown;
  status?: unknown;
}

export interface K8sClients {
  coreV1Api: any;
  appsV1Api: any;
  customObjectsApi: any;
  networkingV1Api: any;
}

export interface PlatformInfo {
  isOpenShift: boolean;
  version: string;
  capabilities: string[];
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    name: string;
    groups?: string[];
  };
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
}
