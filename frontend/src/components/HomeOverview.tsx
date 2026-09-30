import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Title,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';

export function HomeOverview() {
  return (
    <>
      <Title headingLevel="h1" size="2xl">
        Home
      </Title>
      <EmptyState>
        <EmptyStateHeader
          titleText="Cluster overview"
          icon={<EmptyStateIcon icon={CubesIcon} />}
          headingLevel="h4"
        />
        <EmptyStateBody>
          Read-only console: use Workloads or Networking in the navigation to inspect resources.
        </EmptyStateBody>
      </EmptyState>
    </>
  );
}
