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
} from '@patternfly/react-core';
import {
  ExclamationCircleIcon,
  SearchIcon,
  FilterIcon,
} from '@patternfly/react-icons';
import { useNamespace } from '../hooks/useNamespace';
import { api } from '../services/api';
import { useState } from 'react';

export function ServicesList() {
  const { namespace } = useNamespace();
  const [searchValue, setSearchValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data, isLoading, error } = useQuery({
    queryKey: ['services', namespace],
    queryFn: () => api.getServices(namespace),
    enabled: !!namespace,
    refetchInterval: 10000,
  });

  const services = data?.items || [];

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const paginatedServices = filteredServices.slice((page - 1) * perPage, page * perPage);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="xl" />
        <p style={{ marginTop: '1rem', color: '#d2d2d2' }}>Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateHeader
          titleText="Error loading services"
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
            Services
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
                    <DropdownItem value="all">All Services</DropdownItem>
                    <DropdownItem value="clusterip">ClusterIP</DropdownItem>
                    <DropdownItem value="nodeport">NodePort</DropdownItem>
                    <DropdownItem value="loadbalancer">LoadBalancer</DropdownItem>
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
                  itemCount={filteredServices.length}
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

      {filteredServices.length === 0 ? (
        <EmptyState>
          <EmptyStateHeader
            titleText={searchValue ? 'No results found' : `No services found in namespace ${namespace}`}
            icon={<EmptyStateIcon icon={SearchIcon} />}
            headingLevel="h4"
          />
        </EmptyState>
      ) : (
        <Table aria-label="Services table" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Cluster IP</Th>
              <Th>Ports</Th>
              <Th>Age</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedServices.map((service) => {
              const age = new Date(service.createdAt);
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
                <Tr key={service.name}>
                  <Td dataLabel="Name">
                    <a href="#" style={{ color: '#73bcf7', textDecoration: 'none' }}>
                      {service.name}
                    </a>
                  </Td>
                  <Td dataLabel="Type">
                    <span style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #73bcf7',
                      borderRadius: '12px',
                      padding: '2px 12px',
                      fontSize: '13px',
                      color: '#73bcf7',
                      display: 'inline-block'
                    }}>
                      {service.type}
                    </span>
                  </Td>
                  <Td dataLabel="Cluster IP">
                    {service.clusterIP}
                  </Td>
                  <Td dataLabel="Ports">
                    {service.ports.map((p, idx) => (
                      <span key={idx} style={{ marginRight: '8px' }}>
                        {p.port}/{p.protocol}
                      </span>
                    ))}
                  </Td>
                  <Td dataLabel="Age">
                    {ageDisplay}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}

      {filteredServices.length > perPage && (
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
              <Pagination
                itemCount={filteredServices.length}
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
