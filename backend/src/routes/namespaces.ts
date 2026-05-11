import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { KubernetesService } from '../services/kubernetes.service';

export async function namespacesRoutes(fastify: FastifyInstance): Promise<void> {
  const k8sService = new KubernetesService();

  /**
   * List all namespaces
   * GET /api/namespaces
   */
  fastify.get(
    '/api/namespaces',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'List all namespaces in the cluster',
        tags: ['namespaces'],
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
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                    labels: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const namespaces = await k8sService.listNamespaces();

        return reply.send({
          items: namespaces,
          count: namespaces.length,
        });
      } catch (error: any) {
        fastify.log.error(error, 'Failed to list namespaces');
        throw error;
      }
    }
  );
}
