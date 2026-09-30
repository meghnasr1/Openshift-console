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
} from '@patternfly/react-icons';
import { useNamespace } from '../hooks/useNamespace';
import { api } from '../services/api';
import { useState } from 'react';

export function DeploymentsList() {
  const { namespace } = useNamespace();
  const [searchValue, setSearchValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data, isLoading, error } = useQuery({
    queryKey: ['deployments', namespace],
    queryFn: () => api.getDeployments(namespace),
    enabled: !!namespace,
    refetchInterval: 10000,
  });

  const deployments = data?.items || [];

  const filteredDeployments = deployments.filter((deployment) =>
    deployment.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const paginatedDeployments = filteredDeployments.slice((page - 1) * perPage, page * perPage);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="xl" />
        <p style={{ marginTop: '1rem', color: '#d2d2d2' }}>Loading deployments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateHeader
          titleText="Error loading deployments"
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
            Deployments
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
                    <DropdownItem value="all">All Deployments</DropdownItem>
                    <DropdownItem value="available">Available</DropdownItem>
                    <DropdownItem value="progressing">Progressing</DropdownItem>
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
                  itemCount={filteredDeployments.length}
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

      {filteredDeployments.length === 0 ? (
        <EmptyState>
          <EmptyStateHeader
            titleText={searchValue ? 'No results found' : `No deployments found in namespace ${namespace}`}
            icon={<EmptyStateIcon icon={SearchIcon} />}
            headingLevel="h4"
          />
        </EmptyState>
      ) : (
        <Table aria-label="Deployments table" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Replicas</Th>
              <Th>Age</Th>
              <Th>Conditions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedDeployments.map((deployment) => {
              const isReady = deployment.replicas.ready === deployment.replicas.desired;
              const age = new Date(deployment.createdAt);
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
                <Tr key={deployment.name}>
                  <Td dataLabel="Name">
                    <a href="#" style={{ color: '#73bcf7', textDecoration: 'none' }}>
                      {deployment.name}
                    </a>
                  </Td>
                  <Td dataLabel="Status">
                    {isReady ? (
                      <Label color="green" icon={<CheckCircleIcon />}>Available</Label>
                    ) : (
                      <Label color="orange">Progressing</Label>
                    )}
                  </Td>
                  <Td dataLabel="Replicas">
                    {deployment.replicas.ready}/{deployment.replicas.desired}
                  </Td>
                  <Td dataLabel="Age">
                    {ageDisplay}
                  </Td>
                  <Td dataLabel="Conditions">
                    {isReady ? 'Available' : 'Progressing'}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}

      {filteredDeployments.length > perPage && (
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
              <Pagination
                itemCount={filteredDeployments.length}
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
