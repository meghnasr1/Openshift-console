import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ErrorResponse } from '../types';

/**
 * Centralized error handler for the application
 */
export function setupErrorHandler(fastify: any): void {
  fastify.setErrorHandler(
    async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      const statusCode = error.statusCode || 500;

      // Log error with request context
      fastify.log.error(
        {
          err: error,
          url: request.url,
          method: request.method,
          statusCode,
        },
        'Request error'
      );

      // Handle Kubernetes API errors
      if (isK8sApiError(error)) {
        return handleK8sError(error, reply);
      }

      // Handle validation errors
      if (error.validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Request validation failed',
          details: error.validation,
          statusCode: 400,
        });
      }

      // Default error response
      const errorResponse: ErrorResponse = {
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        statusCode,
      };

      // Don't leak internal error details in production
      if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        errorResponse.message = 'An internal error occurred';
      }

      reply.code(statusCode).send(errorResponse);
    }
  );
}

/**
 * Check if error is from Kubernetes API client
 */
function isK8sApiError(error: any): boolean {
  return error.response?.body?.kind === 'Status' || error.statusCode !== undefined;
}

/**
 * Handle Kubernetes API errors with user-friendly messages
 */
function handleK8sError(error: any, reply: FastifyReply): void {
  const k8sError = error.response?.body || error;
  const statusCode = error.statusCode || k8sError.code || 500;

  let message = 'Kubernetes API error';

  // Map common K8s error codes to user-friendly messages
  switch (statusCode) {
    case 401:
      message = 'Not authenticated with Kubernetes cluster';
      break;
    case 403:
      message = 'Access denied. Insufficient permissions to access this resource.';
      break;
    case 404:
      message = 'Resource not found in Kubernetes cluster';
      break;
    case 409:
      message = 'Resource conflict';
      break;
    case 429:
      message = 'Too many requests to Kubernetes API. Please try again later.';
      break;
    case 500:
    case 503:
      message = 'Kubernetes cluster is unavailable or experiencing issues';
      break;
    default:
      message = k8sError.message || 'Kubernetes API error';
  }

  reply.code(statusCode).send({
    error: 'Kubernetes Error',
    message,
    statusCode,
    ...(process.env.NODE_ENV !== 'production' && {
      details: k8sError.message || k8sError.reason,
    }),
  });
}

/**
 * Not Found handler for undefined routes
 */
export function setupNotFoundHandler(fastify: any): void {
  fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.warn(
      {
        url: request.url,
        method: request.method,
      },
      'Route not found'
    );

    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
    });
  });
}
