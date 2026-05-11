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

export function ServicesList() {
  const { namespace } = useNamespace();

  const { data, isLoading, error } = useQuery({
    queryKey: ['services', namespace],
    queryFn: () => api.getServices(namespace),
    enabled: !!namespace,
    refetchInterval: 10000,
  });

  const services = data?.items || [];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner />
        <p>Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateBody>
          Error loading services: {(error as Error).message}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  if (services.length === 0) {
    return (
      <EmptyState>
        <EmptyStateBody>
          No services found in namespace {namespace}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Table aria-label="Services table" variant="compact">
      <Caption>Services in {namespace} ({services.length})</Caption>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Type</Th>
          <Th>Cluster IP</Th>
          <Th>Ports</Th>
          <Th>Created</Th>
        </Tr>
      </Thead>
      <Tbody>
        {services.map((service) => (
          <Tr key={service.name}>
            <Td dataLabel="Name">{service.name}</Td>
            <Td dataLabel="Type">{service.type}</Td>
            <Td dataLabel="Cluster IP">{service.clusterIP}</Td>
            <Td dataLabel="Ports">
              {service.ports.map((p, idx) => (
                <div key={idx}>
                  {p.port}→{p.targetPort}/{p.protocol}
                </div>
              ))}
            </Td>
            <Td dataLabel="Created">
              {new Date(service.createdAt).toLocaleString()}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
