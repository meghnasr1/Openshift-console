import { useQuery } from '@tanstack/react-query';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import {
  Spinner,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Pagination,
  Title,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import {
  ExclamationCircleIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import { useNamespace } from '../hooks/useNamespace';
import { api } from '../services/api';
import { useState } from 'react';

export function PodsList() {
  const { namespace } = useNamespace();
  const [searchValue, setSearchValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data, isLoading, error } = useQuery({
    queryKey: ['pods', namespace],
    queryFn: () => api.getPods(namespace),
    enabled: !!namespace,
    refetchInterval: 10000,
  });

  const pods = data?.items || [];

  // Filter pods based on search
  const filteredPods = pods.filter((pod) =>
    pod.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Pagination
  const paginatedPods = filteredPods.slice((page - 1) * perPage, page * perPage);

  const getStatusLabel = (status: string) => {
    if (status === 'Running') {
      return <Label color="green" icon={<CheckCircleIcon />}>{status}</Label>;
    } else if (status === 'Pending') {
      return <Label color="orange" icon={<ExclamationTriangleIcon />}>{status}</Label>;
    } else {
      return <Label color="red" icon={<ExclamationCircleIcon />}>{status}</Label>;
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="xl" />
        <p style={{ marginTop: '1rem', color: '#d2d2d2' }}>Loading pods...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateHeader
          titleText="Error loading pods"
          icon={<EmptyStateIcon icon={ExclamationCircleIcon} color="var(--pf-v5-global--danger-color--100)" />}
          headingLevel="h4"
        />
        <EmptyStateBody>
          {(error as Error).message}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <div>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px', color: '#ffffff' }}>
            Pods
          </Title>
        </FlexItem>

        <FlexItem>
          <Toolbar style={{ paddingLeft: 0, paddingRight: 0, marginBottom: '16px' }}>
            <ToolbarContent style={{ paddingLeft: 0 }}>
              <ToolbarItem>
                <Dropdown
                  isOpen={isFilterOpen}
                  onSelect={() => setIsFilterOpen(false)}
                  onOpenChange={(isOpen: boolean) => setIsFilterOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      isExpanded={isFilterOpen}
                      icon={<FilterIcon />}
                    >
                      Filter
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem value="all">All Pods</DropdownItem>
                    <DropdownItem value="running">Running</DropdownItem>
                    <DropdownItem value="pending">Pending</DropdownItem>
                    <DropdownItem value="failed">Failed</DropdownItem>
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>

              <ToolbarItem variant="search-filter">
                <SearchInput
                  placeholder="Search by name..."
                  value={searchValue}
                  onChange={(_event, value) => setSearchValue(value)}
                  onClear={() => setSearchValue('')}
                  style={{ minWidth: '300px' }}
                />
              </ToolbarItem>

              <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
                <Pagination
                  itemCount={filteredPods.length}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_evt, newPage) => setPage(newPage)}
                  onPerPageSelect={(_evt, newPerPage) => {
                    setPerPage(newPerPage);
                    setPage(1);
                  }}
                  variant="top"
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </FlexItem>
      </Flex>

      {filteredPods.length === 0 ? (
        <EmptyState>
          <EmptyStateHeader
            titleText={searchValue ? 'No results found' : `No pods found in namespace ${namespace}`}
            icon={<EmptyStateIcon icon={SearchIcon} />}
            headingLevel="h4"
          />
          {searchValue && (
            <EmptyStateBody>
              No pods match the filter criteria. Try changing your filter or search term.
            </EmptyStateBody>
          )}
        </EmptyState>
      ) : (
        <Table aria-label="Pods table" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Ready</Th>
              <Th>Restarts</Th>
              <Th>Age</Th>
              <Th>Node</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedPods.map((pod) => {
              const readyCount = pod.containers.filter((c) => c.ready).length;
              const totalRestarts = pod.containers.reduce((sum, c) => sum + c.restartCount, 0);
              const age = new Date(pod.createdAt);
              const now = new Date();
              const diffMs = now.getTime() - age.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHours / 24);

              let ageDisplay = '';
              if (diffDays > 0) {
                ageDisplay = `${diffDays}d`;
              } else if (diffHours > 0) {
                ageDisplay = `${diffHours}h`;
              } else {
                ageDisplay = `${diffMins}m`;
              }

              return (
                <Tr key={pod.name}>
                  <Td dataLabel="Name">
                    <a href="#" style={{ color: '#73bcf7', textDecoration: 'none' }}>
                      {pod.name}
                    </a>
                  </Td>
                  <Td dataLabel="Status">
                    {getStatusLabel(pod.status)}
                  </Td>
                  <Td dataLabel="Ready">
                    {readyCount}/{pod.containers.length}
                  </Td>
                  <Td dataLabel="Restarts">
                    {totalRestarts}
                  </Td>
                  <Td dataLabel="Age">
                    {ageDisplay}
                  </Td>
                  <Td dataLabel="Node">
                    -
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}

      {filteredPods.length > perPage && (
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
              <Pagination
                itemCount={filteredPods.length}
                perPage={perPage}
                page={page}
                onSetPage={(_evt, newPage) => setPage(newPage)}
                onPerPageSelect={(_evt, newPerPage) => {
                  setPerPage(newPerPage);
                  setPage(1);
                }}
                variant="bottom"
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      )}
    </div>
  );
}
