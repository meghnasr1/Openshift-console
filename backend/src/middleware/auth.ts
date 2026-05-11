import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AuthenticatedRequest } from '../types';

/**
 * Mock Authentication Middleware (MVP)
 * Simple API key authentication for development
 * Will be replaced with full OIDC/SSO in production
 */

const API_KEY = process.env.API_KEY || 'dev-api-key-change-in-production';

export async function setupMockAuth(fastify: FastifyInstance): Promise<void> {
  // Decorate request with authenticate method
  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // Skip auth for health and info endpoints
    if (request.url === '/health' || request.url === '/info') {
      return;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Missing Authorization header',
        statusCode: 401,
      });
      return;
    }

    // Support both "Bearer <token>" and "<token>" formats
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (token !== API_KEY) {
      fastify.log.warn({ url: request.url }, 'Invalid API key');
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key',
        statusCode: 401,
      });
      return;
    }

    // Attach mock user info to request
    (request as AuthenticatedRequest).user = {
      id: 'mock-user',
      name: 'Development User',
      groups: ['readonly-users'],
    };

    fastify.log.debug({ user: (request as AuthenticatedRequest).user }, 'User authenticated');
  });

  fastify.log.info('Mock authentication configured (API key)');
  fastify.log.warn('Using mock auth - replace with OIDC/SSO for production!');
}

/**
 * Setup for future OIDC/SSO integration
 * Uncomment and configure when ready to add full SSO
 */

/*
import { Issuer, Strategy } from 'openid-client';
import session from '@fastify/session';
import cookie from '@fastify/cookie';

export async function setupOIDCAuth(fastify: FastifyInstance): Promise<void> {
  const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL;
  const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
  const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
  const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI;
  const SESSION_SECRET = process.env.SESSION_SECRET;

  if (!OIDC_ISSUER_URL || !OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET || !SESSION_SECRET) {
    throw new Error('Missing required OIDC configuration');
  }

  // Discover OIDC provider
  const issuer = await Issuer.discover(OIDC_ISSUER_URL);
  const client = new issuer.Client({
    client_id: OIDC_CLIENT_ID,
    client_secret: OIDC_CLIENT_SECRET,
    redirect_uris: [OIDC_REDIRECT_URI],
    response_types: ['code'],
  });

  // Register cookie and session plugins
  await fastify.register(cookie);
  await fastify.register(session, {
    secret: SESSION_SECRET,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    },
  });

  // Decorate fastify with OIDC client
  fastify.decorate('oidcClient', client);

  // Authentication decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.session.user) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated. Please login.',
        statusCode: 401,
      });
      return;
    }
  });

  fastify.log.info('OIDC authentication configured');
}
*/

/**
 * Get authenticated user from request
 */
export function getAuthenticatedUser(request: FastifyRequest): AuthenticatedRequest['user'] {
  return (request as AuthenticatedRequest).user;
}
