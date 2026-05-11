import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { KubernetesService } from '../services/kubernetes.service';

interface PodsQuerystring {
  namespace: string;
}

interface PodParams {
  namespace: string;
  name: string;
}

export async function podsRoutes(fastify: FastifyInstance): Promise<void> {
  const k8sService = new KubernetesService();

  /**
   * List pods in a namespace
   * GET /api/pods?namespace=default
   */
  fastify.get<{ Querystring: PodsQuerystring }>(
    '/api/pods',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'List all pods in a namespace',
        tags: ['pods'],
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
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                    labels: { type: 'object' },
                    containers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          image: { type: 'string' },
                          ready: { type: 'boolean' },
                          restartCount: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: PodsQuerystring }>, reply: FastifyReply) => {
      const { namespace } = request.query;

      try {
        const pods = await k8sService.listPods(namespace);

        return reply.send({
          items: pods,
          count: pods.length,
        });
      } catch (error: any) {
        fastify.log.error({ namespace }, 'Failed to list pods');
        throw error;
      }
    }
  );

  /**
   * Get a specific pod
   * GET /api/pods/:namespace/:name
   */
  fastify.get<{ Params: PodParams }>(
    '/api/pods/:namespace/:name',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get a specific pod',
        tags: ['pods'],
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
    async (request: FastifyRequest<{ Params: PodParams }>, reply: FastifyReply) => {
      const { namespace, name } = request.params;

      try {
        const pod = await k8sService.getPod(namespace, name);

        return reply.send(pod);
      } catch (error: any) {
        fastify.log.error({ namespace, name }, 'Failed to get pod');
        throw error;
      }
    }
  );
}
