import { getK8sClients } from '../config/kubernetes';
import {
  PodInfo,
  DeploymentInfo,
  ServiceInfo,
  NamespaceInfo,
  ContainerInfo,
  ServicePort,
} from '../types';

/**
 * Kubernetes Service Layer
 * Wraps K8s API calls and transforms responses to our internal types
 */

export class KubernetesService {
  /**
   * List all namespaces
   */
  async listNamespaces(): Promise<NamespaceInfo[]> {
    const clients = getK8sClients();

    try {
      const response = await clients.coreV1Api.listNamespace();

      return response.body.items.map((ns: any) => ({
        name: ns.metadata.name,
        status: ns.status.phase || 'Unknown',
        createdAt: ns.metadata.creationTimestamp,
        labels: ns.metadata.labels || {},
      }));
    } catch (error: any) {
      throw new Error(`Failed to list namespaces: ${error.message}`);
    }
  }

  /**
   * List pods in a namespace
   */
  async listPods(namespace: string): Promise<PodInfo[]> {
    const clients = getK8sClients();

    try {
      const response = await clients.coreV1Api.listNamespacedPod(namespace);

      return response.body.items.map((pod: any) => {
        const containers: ContainerInfo[] = pod.spec?.containers?.map((c: any) => {
          // Find container status
          const containerStatus = pod.status?.containerStatuses?.find(
            (cs: any) => cs.name === c.name
          );

          return {
            name: c.name,
            image: c.image,
            ready: containerStatus?.ready || false,
            restartCount: containerStatus?.restartCount || 0,
          };
        }) || [];

        return {
          name: pod.metadata.name,
          namespace: pod.metadata.namespace,
          status: pod.status?.phase || 'Unknown',
          createdAt: pod.metadata.creationTimestamp,
          labels: pod.metadata.labels || {},
          containers,
        };
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Namespace '${namespace}' not found`);
      }
      throw new Error(`Failed to list pods in namespace ${namespace}: ${error.message}`);
    }
  }

  /**
   * Get a specific pod
   */
  async getPod(namespace: string, name: string): Promise<PodInfo> {
    const clients = getK8sClients();

    try {
      const response = await clients.coreV1Api.readNamespacedPod(name, namespace);
      const pod = response.body;

      const containers: ContainerInfo[] = pod.spec?.containers?.map((c: any) => {
        const containerStatus = pod.status?.containerStatuses?.find(
          (cs: any) => cs.name === c.name
        );

        return {
          name: c.name,
          image: c.image,
          ready: containerStatus?.ready || false,
          restartCount: containerStatus?.restartCount || 0,
        };
      }) || [];

      return {
        name: pod.metadata!.name!,
        namespace: pod.metadata!.namespace!,
        status: pod.status?.phase || 'Unknown',
        createdAt: pod.metadata!.creationTimestamp!,
        labels: pod.metadata!.labels || {},
        containers,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Pod '${name}' not found in namespace '${namespace}'`);
      }
      throw new Error(`Failed to get pod ${namespace}/${name}: ${error.message}`);
    }
  }

  /**
   * List deployments in a namespace
   */
  async listDeployments(namespace: string): Promise<DeploymentInfo[]> {
    const clients = getK8sClients();

    try {
      const response = await clients.appsV1Api.listNamespacedDeployment(namespace);

      return response.body.items.map((deployment: any) => ({
        name: deployment.metadata.name,
        namespace: deployment.metadata.namespace,
        replicas: {
          desired: deployment.spec?.replicas || 0,
          ready: deployment.status?.readyReplicas || 0,
          available: deployment.status?.availableReplicas || 0,
        },
        createdAt: deployment.metadata.creationTimestamp,
        labels: deployment.metadata.labels || {},
        selector: deployment.spec?.selector?.matchLabels || {},
      }));
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Namespace '${namespace}' not found`);
      }
      throw new Error(`Failed to list deployments in namespace ${namespace}: ${error.message}`);
    }
  }

  /**
   * Get a specific deployment
   */
  async getDeployment(namespace: string, name: string): Promise<DeploymentInfo> {
    const clients = getK8sClients();

    try {
      const response = await clients.appsV1Api.readNamespacedDeployment(name, namespace);
      const deployment = response.body;

      return {
        name: deployment.metadata!.name!,
        namespace: deployment.metadata!.namespace!,
        replicas: {
          desired: deployment.spec?.replicas || 0,
          ready: deployment.status?.readyReplicas || 0,
          available: deployment.status?.availableReplicas || 0,
        },
        createdAt: deployment.metadata!.creationTimestamp!,
        labels: deployment.metadata!.labels || {},
        selector: deployment.spec?.selector?.matchLabels || {},
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Deployment '${name}' not found in namespace '${namespace}'`);
      }
      throw new Error(`Failed to get deployment ${namespace}/${name}: ${error.message}`);
    }
  }

  /**
   * List services in a namespace
   */
  async listServices(namespace: string): Promise<ServiceInfo[]> {
    const clients = getK8sClients();

    try {
      const response = await clients.coreV1Api.listNamespacedService(namespace);

      return response.body.items.map((service: any) => {
        const ports: ServicePort[] = service.spec?.ports?.map((p: any) => ({
          name: p.name,
          port: p.port,
          targetPort: p.targetPort,
          protocol: p.protocol || 'TCP',
        })) || [];

        return {
          name: service.metadata.name,
          namespace: service.metadata.namespace,
          type: service.spec?.type || 'ClusterIP',
          clusterIP: service.spec?.clusterIP || '',
          ports,
          createdAt: service.metadata.creationTimestamp,
          labels: service.metadata.labels || {},
          selector: service.spec?.selector || {},
        };
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Namespace '${namespace}' not found`);
      }
      throw new Error(`Failed to list services in namespace ${namespace}: ${error.message}`);
    }
  }

  /**
   * Get a specific service
   */
  async getService(namespace: string, name: string): Promise<ServiceInfo> {
    const clients = getK8sClients();

    try {
      const response = await clients.coreV1Api.readNamespacedService(name, namespace);
      const service = response.body;

      const ports: ServicePort[] = service.spec?.ports?.map((p: any) => ({
        name: p.name,
        port: p.port,
        targetPort: p.targetPort,
        protocol: p.protocol || 'TCP',
      })) || [];

      return {
        name: service.metadata!.name!,
        namespace: service.metadata!.namespace!,
        type: service.spec?.type || 'ClusterIP',
        clusterIP: service.spec?.clusterIP || '',
        ports,
        createdAt: service.metadata!.creationTimestamp!,
        labels: service.metadata!.labels || {},
        selector: service.spec?.selector || {},
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Service '${name}' not found in namespace '${namespace}'`);
      }
      throw new Error(`Failed to get service ${namespace}/${name}: ${error.message}`);
    }
  }
}
