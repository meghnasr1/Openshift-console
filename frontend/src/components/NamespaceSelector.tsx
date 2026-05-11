import { useQuery } from '@tanstack/react-query';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { useState } from 'react';
import { useNamespace } from '../hooks/useNamespace';
import { api } from '../services/api';

export function NamespaceSelector() {
  const { namespace, setNamespace } = useNamespace();
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => api.getNamespaces(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const namespaces = data?.items || [];

  const handleSelect = (_event: any, value: string) => {
    setNamespace(value);
    setIsOpen(false);
  };

  if (error) {
    return <div>Error loading namespaces: {(error as Error).message}</div>;
  }

  return (
    <Select
      variant={SelectVariant.single}
      onToggle={(_event, isOpen) => setIsOpen(isOpen)}
      onSelect={handleSelect}
      selections={namespace}
      isOpen={isOpen}
      placeholderText="Select namespace"
      isDisabled={isLoading}
    >
      {namespaces.map((ns) => (
        <SelectOption key={ns.name} value={ns.name}>
          {ns.name}
        </SelectOption>
      ))}
    </Select>
  );
}
