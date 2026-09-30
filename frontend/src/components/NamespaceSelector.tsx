import { useQuery } from '@tanstack/react-query';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { ProjectIcon } from '@patternfly/react-icons';
import { useState, type MouseEvent } from 'react';
import { useNamespace } from '../hooks/useNamespace';
import { api } from '../services/api';

export function NamespaceSelector() {
  const { namespace, setNamespace } = useNamespace();
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => api.getNamespaces(),
    refetchInterval: 30000,
  });

  const namespaces = data?.items || [];

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event?: MouseEvent<Element>, value?: string | number | undefined) => {
    if (typeof value === 'string') {
      setNamespace(value);
    }
    setIsOpen(false);
  };

  if (error) {
    return (
      <p style={{ color: 'var(--pf-v5-global--danger-color--100)', margin: 0 }}>
        Error loading projects
      </p>
    );
  }

  const toggleLabel = isLoading ? 'Loading...' : namespace || 'Select project';

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
      <FlexItem>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <ProjectIcon />
          </FlexItem>
          <FlexItem>
            <span style={{ fontWeight: 'var(--pf-v5-global--FontWeight--bold)' }}>Project:</span>
          </FlexItem>
        </Flex>
      </FlexItem>
      <FlexItem>
        <Dropdown
          isOpen={isOpen}
          onSelect={onSelect}
          onOpenChange={(open: boolean) => setIsOpen(open)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              onClick={onToggle}
              isExpanded={isOpen}
              isDisabled={isLoading}
              style={{ minWidth: '14rem' }}
            >
              {toggleLabel}
            </MenuToggle>
          )}
        >
          <DropdownList>
            {namespaces.map((ns) => (
              <DropdownItem key={ns.name} value={ns.name}>
                {ns.name}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      </FlexItem>
    </Flex>
  );
}
