import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import {
  isResourceBlocked,
  isApiGroupAllowed,
  isCoreResourceAllowed,
  isAppsResourceAllowed,
  isNetworkingResourceAllowed,
} from '../config/allowed-resources';

/**
 * Resource Filter Middleware
 * Defense in depth: blocks access to sensitive resources even if RBAC is misconfigured
 */
export async function resourceFilterMiddleware(
  fastify: FastifyInstance
): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Extract resource type from route params or query
    const params = request.params as any;
    const query = request.query as any;

    const kind = params.kind || params.resourceType || query.kind;
    const apiGroup = params.apiGroup || params.group || query.group;

    // Skip check for non-resource routes (health, auth, etc.)
    if (!request.url.startsWith('/api/')) {
      return;
    }

    // Skip check for routes that don't specify a resource
    if (!kind && !apiGroup && !request.url.match(/\/(pods|deployments|services|namespaces)/)) {
      return;
    }

    // Check if resource kind is explicitly blocked
    if (kind && isResourceBlocked(kind)) {
      fastify.log.warn({ kind, url: request.url }, 'Blocked access to sensitive resource');
      reply.code(403).send({
        error: 'Forbidden',
        message: `Access to resource type '${kind}' is not allowed`,
        statusCode: 403,
      });
      return;
    }

    // For custom resources, validate API group allowlist
    if (apiGroup) {
      if (!isApiGroupAllowed(apiGroup)) {
        fastify.log.warn({ apiGroup, url: request.url }, 'Blocked access to non-allowed API group');
        reply.code(403).send({
          error: 'Forbidden',
          message: `Access to API group '${apiGroup}' is not allowed`,
          statusCode: 403,
        });
        return;
      }
    }

    // Additional validation for specific resource types
    if (kind) {
      const isAllowed =
        isCoreResourceAllowed(kind) ||
        isAppsResourceAllowed(kind) ||
        isNetworkingResourceAllowed(kind);

      if (!isAllowed && !apiGroup) {
        // Resource not in allowlist and no API group specified
        fastify.log.warn({ kind, url: request.url }, 'Blocked access to non-allowed resource type');
        reply.code(403).send({
          error: 'Forbidden',
          message: `Access to resource type '${kind}' is not allowed`,
          statusCode: 403,
        });
        return;
      }
    }

    // Ensure only GET/LIST operations (read-only)
    const method = request.method.toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      fastify.log.warn({ method, url: request.url }, 'Blocked non-read operation');
      reply.code(405).send({
        error: 'Method Not Allowed',
        message: 'Only read operations (GET) are allowed',
        statusCode: 405,
      });
      return;
    }
  });
}

/**
 * Sanitize Kubernetes resource response
 * Remove sensitive fields that might be present in the response
 */
export function sanitizeResourceData(data: any): any {
  if (!data) return data;

  // If it's an array, sanitize each item
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResourceData(item));
  }

  // If it's not an object, return as-is
  if (typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  // Remove sensitive fields from metadata
  if (sanitized.metadata) {
    delete sanitized.metadata.managedFields; // Large and not user-relevant
  }

  // Remove sensitive fields from spec
  if (sanitized.spec) {
    delete sanitized.spec.imagePullSecrets; // Contains secret references
    if (sanitized.spec.containers) {
      sanitized.spec.containers = sanitized.spec.containers.map((container: any) => ({
        name: container.name,
        image: container.image,
        ports: container.ports,
        resources: container.resources,
        // Do NOT include: env, envFrom, volumeMounts (may reference secrets)
      }));
    }
    if (sanitized.spec.volumes) {
      // Remove secret volumes entirely
      sanitized.spec.volumes = sanitized.spec.volumes.filter(
        (vol: any) => !vol.secret && !vol.projected
      );
    }
  }

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Don't recursively sanitize arrays of primitives
      if (!Array.isArray(sanitized[key]) || typeof sanitized[key][0] === 'object') {
        sanitized[key] = sanitizeResourceData(sanitized[key]);
      }
    }
  });

  return sanitized;
}
