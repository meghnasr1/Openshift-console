import axios, { AxiosInstance } from 'axios';
import {
  NamespaceInfo,
  PodInfo,
  DeploymentInfo,
  ServiceInfo,
  ApiResponse,
  PlatformInfo,
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
        // Include API key for mock auth
        Authorization: `Bearer ${import.meta.env.VITE_API_KEY || 'dev-api-key-change-in-production'}`,
      },
      withCredentials: true,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const message = error.response.data?.message || error.message;
          throw new Error(message);
        }
        throw error;
      }
    );
  }

  // Health check
  async health(): Promise<{ status: string; kubernetes: string }> {
    const { data } = await this.client.get('/health');
    return data;
  }

  // Platform info
  async getPlatformInfo(): Promise<PlatformInfo> {
    const { data } = await this.client.get('/info');
    return data;
  }

  // Namespaces
  async getNamespaces(): Promise<ApiResponse<NamespaceInfo>> {
    const { data } = await this.client.get('/namespaces');
    return data;
  }

  // Pods
  async getPods(namespace: string): Promise<ApiResponse<PodInfo>> {
    const { data } = await this.client.get('/pods', {
      params: { namespace },
    });
    return data;
  }

  async getPod(namespace: string, name: string): Promise<PodInfo> {
    const { data } = await this.client.get(`/pods/${namespace}/${name}`);
    return data;
  }

  // Deployments
  async getDeployments(namespace: string): Promise<ApiResponse<DeploymentInfo>> {
    const { data } = await this.client.get('/deployments', {
      params: { namespace },
    });
    return data;
  }

  async getDeployment(namespace: string, name: string): Promise<DeploymentInfo> {
    const { data } = await this.client.get(`/deployments/${namespace}/${name}`);
    return data;
  }

  // Services
  async getServices(namespace: string): Promise<ApiResponse<ServiceInfo>> {
    const { data } = await this.client.get('/services', {
      params: { namespace },
    });
    return data;
  }

  async getService(namespace: string, name: string): Promise<ServiceInfo> {
    const { data } = await this.client.get(`/services/${namespace}/${name}`);
    return data;
  }
}

export const api = new ApiClient();
