import { useQuery } from '@tanstack/react-query';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Caption,
} from '@patternfly/react-table';
import { Spinner, EmptyState, EmptyStateBody } from '@patternfly/react-core';
import { useNamespace } from '../hooks/useNamespace';
import { api } from '../services/api';

export function DeploymentsList() {
  const { namespace } = useNamespace();

  const { data, isLoading, error } = useQuery({
    queryKey: ['deployments', namespace],
    queryFn: () => api.getDeployments(namespace),
    enabled: !!namespace,
    refetchInterval: 10000,
  });

  const deployments = data?.items || [];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner />
        <p>Loading deployments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateBody>
          Error loading deployments: {(error as Error).message}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  if (deployments.length === 0) {
    return (
      <EmptyState>
        <EmptyStateBody>
          No deployments found in namespace {namespace}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Table aria-label="Deployments table" variant="compact">
      <Caption>Deployments in {namespace} ({deployments.length})</Caption>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Desired</Th>
          <Th>Ready</Th>
          <Th>Available</Th>
          <Th>Created</Th>
        </Tr>
      </Thead>
      <Tbody>
        {deployments.map((deployment) => (
          <Tr key={deployment.name}>
            <Td dataLabel="Name">{deployment.name}</Td>
            <Td dataLabel="Desired">{deployment.replicas.desired}</Td>
            <Td dataLabel="Ready">
              <span
                style={{
                  color:
                    deployment.replicas.ready === deployment.replicas.desired
                      ? 'green'
                      : 'orange',
                }}
              >
                {deployment.replicas.ready}
              </span>
            </Td>
            <Td dataLabel="Available">{deployment.replicas.available}</Td>
            <Td dataLabel="Created">
              {new Date(deployment.createdAt).toLocaleString()}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
