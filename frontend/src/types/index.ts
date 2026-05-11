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

export interface ApiResponse<T> {
  items: T[];
  count?: number;
}

export interface PlatformInfo {
  platform: string;
  isOpenShift: boolean;
  capabilities: string[];
  apiVersion: string;
}
