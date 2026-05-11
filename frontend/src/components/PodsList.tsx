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

export function PodsList() {
  const { namespace } = useNamespace();

  const { data, isLoading, error } = useQuery({
    queryKey: ['pods', namespace],
    queryFn: () => api.getPods(namespace),
    enabled: !!namespace,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const pods = data?.items || [];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner />
        <p>Loading pods...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateBody>
          Error loading pods: {(error as Error).message}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  if (pods.length === 0) {
    return (
      <EmptyState>
        <EmptyStateBody>
          No pods found in namespace {namespace}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Table aria-label="Pods table" variant="compact">
      <Caption>Pods in {namespace} ({pods.length})</Caption>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Status</Th>
          <Th>Containers</Th>
          <Th>Ready</Th>
          <Th>Restarts</Th>
          <Th>Created</Th>
        </Tr>
      </Thead>
      <Tbody>
        {pods.map((pod) => {
          const readyCount = pod.containers.filter((c) => c.ready).length;
          const totalRestarts = pod.containers.reduce((sum, c) => sum + c.restartCount, 0);

          return (
            <Tr key={pod.name}>
              <Td dataLabel="Name">{pod.name}</Td>
              <Td dataLabel="Status">
                <span style={{ color: pod.status === 'Running' ? 'green' : 'orange' }}>
                  {pod.status}
                </span>
              </Td>
              <Td dataLabel="Containers">{pod.containers.length}</Td>
              <Td dataLabel="Ready">
                {readyCount}/{pod.containers.length}
              </Td>
              <Td dataLabel="Restarts">{totalRestarts}</Td>
              <Td dataLabel="Created">
                {new Date(pod.createdAt).toLocaleString()}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}
