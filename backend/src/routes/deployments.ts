import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { KubernetesService } from '../services/kubernetes.service';

interface DeploymentsQuerystring {
  namespace: string;
}

interface DeploymentParams {
  namespace: string;
  name: string;
}

export async function deploymentsRoutes(fastify: FastifyInstance): Promise<void> {
  const k8sService = new KubernetesService();

  /**
   * List deployments in a namespace
   * GET /api/deployments?namespace=default
   */
  fastify.get<{ Querystring: DeploymentsQuerystring }>(
    '/api/deployments',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'List all deployments in a namespace',
        tags: ['deployments'],
        querystring: {
          type: 'object',
          required: ['namespace'],
          properties: {
            namespace: {
              type: 'string',
              description: 'Kubernetes namespace',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    namespace: { type: 'string' },
                    replicas: {
                      type: 'object',
                      properties: {
                        desired: { type: 'number' },
                        ready: { type: 'number' },
                        available: { type: 'number' },
                      },
                    },
                    createdAt: { type: 'string' },
                    labels: { type: 'object' },
                    selector: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: DeploymentsQuerystring }>,
      reply: FastifyReply
    ) => {
      const { namespace } = request.query;

      try {
        const deployments = await k8sService.listDeployments(namespace);

        return reply.send({
          items: deployments,
          count: deployments.length,
        });
      } catch (error: any) {
        fastify.log.error({ namespace }, 'Failed to list deployments');
        throw error;
      }
    }
  );

  /**
   * Get a specific deployment
   * GET /api/deployments/:namespace/:name
   */
  fastify.get<{ Params: DeploymentParams }>(
    '/api/deployments/:namespace/:name',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get a specific deployment',
        tags: ['deployments'],
        params: {
          type: 'object',
          required: ['namespace', 'name'],
          properties: {
            namespace: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: DeploymentParams }>, reply: FastifyReply) => {
      const { namespace, name } = request.params;

      try {
        const deployment = await k8sService.getDeployment(namespace, name);

        return reply.send(deployment);
      } catch (error: any) {
        fastify.log.error({ namespace, name }, 'Failed to get deployment');
        throw error;
      }
    }
  );
}
