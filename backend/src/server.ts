import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { createK8sClient, detectPlatform, checkK8sConnection } from './config/kubernetes';
import { setupMockAuth } from './middleware/auth';
import { resourceFilterMiddleware } from './middleware/resource-filter';
import { setupErrorHandler, setupNotFoundHandler } from './middleware/error-handler';
import { namespacesRoutes } from './routes/namespaces';
import { podsRoutes } from './routes/pods';
import { deploymentsRoutes } from './routes/deployments';
import { servicesRoutes } from './routes/services';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * Create and configure Fastify server
 */
async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: LOG_LEVEL,
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    trustProxy: true,
  });

  // Register plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10),
  });

  // Setup authentication (mock for MVP)
  await setupMockAuth(fastify);

  // Setup resource filter middleware
  await resourceFilterMiddleware(fastify);

  // Register routes
  fastify.get('/health', async (request, reply) => {
    const k8sConnected = await checkK8sConnection();

    return reply.send({
      status: k8sConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      kubernetes: k8sConnected ? 'connected' : 'disconnected',
    });
  });

  fastify.get('/info', async (request, reply) => {
    const platform = await detectPlatform();

    return reply.send({
      platform: platform.version,
      isOpenShift: platform.isOpenShift,
      capabilities: platform.capabilities,
      apiVersion: 'v1',
    });
  });

  // Register API routes
  await fastify.register(namespacesRoutes);
  await fastify.register(podsRoutes);
  await fastify.register(deploymentsRoutes);
  await fastify.register(servicesRoutes);

  // Setup error handlers
  setupErrorHandler(fastify);
  setupNotFoundHandler(fastify);

  return fastify;
}

/**
 * Start the server
 */
async function start() {
  try {
    console.log('Starting Read-Only Kubernetes Console...');

    // Initialize Kubernetes client
    console.log('Initializing Kubernetes client...');
    createK8sClient();

    // Detect platform
    console.log('Detecting platform...');
    const platform = await detectPlatform();
    console.log(`Platform: ${platform.version} (OpenShift: ${platform.isOpenShift})`);
    console.log(`Capabilities: ${platform.capabilities.join(', ') || 'none'}`);

    // Check K8s connection
    console.log('Checking Kubernetes API connection...');
    const connected = await checkK8sConnection();
    if (!connected) {
      console.error('Failed to connect to Kubernetes API');
      process.exit(1);
    }
    console.log('Kubernetes API connection successful');

    // Build and start server
    const fastify = await buildServer();

    await fastify.listen({ port: PORT, host: HOST });

    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`Health check: http://${HOST}:${PORT}/health`);
    console.log(`Platform info: http://${HOST}:${PORT}/info`);
    console.log('');
    console.log('API Endpoints:');
    console.log(`  GET /api/namespaces`);
    console.log(`  GET /api/pods?namespace=<namespace>`);
    console.log(`  GET /api/deployments?namespace=<namespace>`);
    console.log(`  GET /api/services?namespace=<namespace>`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start the server
start();
