import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { KubernetesService } from '../services/kubernetes.service';

interface ServicesQuerystring {
  namespace: string;
}

interface ServiceParams {
  namespace: string;
  name: string;
}

export async function servicesRoutes(fastify: FastifyInstance): Promise<void> {
  const k8sService = new KubernetesService();

  /**
   * List services in a namespace
   * GET /api/services?namespace=default
   */
  fastify.get<{ Querystring: ServicesQuerystring }>(
    '/api/services',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'List all services in a namespace',
        tags: ['services'],
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
                    type: { type: 'string' },
                    clusterIP: { type: 'string' },
                    ports: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          port: { type: 'number' },
                          targetPort: { type: ['string', 'number'] },
                          protocol: { type: 'string' },
                        },
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
    async (request: FastifyRequest<{ Querystring: ServicesQuerystring }>, reply: FastifyReply) => {
      const { namespace } = request.query;

      try {
        const services = await k8sService.listServices(namespace);

        return reply.send({
          items: services,
          count: services.length,
        });
      } catch (error: any) {
        fastify.log.error({ namespace }, 'Failed to list services');
        throw error;
      }
    }
  );

  /**
   * Get a specific service
   * GET /api/services/:namespace/:name
   */
  fastify.get<{ Params: ServiceParams }>(
    '/api/services/:namespace/:name',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get a specific service',
        tags: ['services'],
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
    async (request: FastifyRequest<{ Params: ServiceParams }>, reply: FastifyReply) => {
      const { namespace, name } = request.params;

      try {
        const service = await k8sService.getService(namespace, name);

        return reply.send(service);
      } catch (error: any) {
        fastify.log.error({ namespace, name }, 'Failed to get service');
        throw error;
      }
    }
  );
}
