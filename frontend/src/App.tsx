import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Page,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageSection,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Button,
  NotificationBadge,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
  Divider,
} from '@patternfly/react-core';
import {
  BarsIcon,
  BellIcon,
  QuestionCircleIcon,
  EllipsisVIcon,
  ThIcon,
  PlusIcon,
} from '@patternfly/react-icons';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { NamespaceProvider } from './hooks/useNamespace';
import { Sidebar } from './components/Sidebar';
import { PodsList } from './components/PodsList';
import { DeploymentsList } from './components/DeploymentsList';
import { ServicesList } from './components/ServicesList';
import { HomeOverview } from './components/HomeOverview';
import { NamespaceSelector } from './components/NamespaceSelector';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [isKebabOpen, setIsKebabOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const HeaderToolbar = (
    <Toolbar isFullHeight isStatic>
      <ToolbarContent>
        <ToolbarGroup
          variant="icon-button-group"
          align={{ default: 'alignRight' }}
          spacer={{ default: 'spacerNone', md: 'spacerMd' }}
        >
          <ToolbarItem>
            <Button variant="plain" aria-label="Application launcher">
              <ThIcon />
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <NotificationBadge
              variant="unread"
              onClick={() => {}}
              aria-label="Notifications"
              count={71}
            >
              <BellIcon />
            </NotificationBadge>
          </ToolbarItem>
          <ToolbarItem>
            <Button variant="plain" aria-label="Import YAML">
              <PlusIcon />
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button variant="plain" aria-label="Help">
              <QuestionCircleIcon />
            </Button>
          </ToolbarItem>
          <ToolbarItem visibility={{ default: 'hidden', md: 'visible' }}>
            <Dropdown
              isOpen={isKebabOpen}
              onSelect={() => setIsKebabOpen(false)}
              onOpenChange={(isOpen) => setIsKebabOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsKebabOpen(!isKebabOpen)}
                  isExpanded={isKebabOpen}
                  variant="plain"
                  aria-label="Actions"
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem>Action 1</DropdownItem>
                <DropdownItem>Action 2</DropdownItem>
              </DropdownList>
            </Dropdown>
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarItem visibility={{ default: 'hidden', md: 'visible' }}>
          <Dropdown
            isOpen={isUserMenuOpen}
            onSelect={() => setIsUserMenuOpen(false)}
            onOpenChange={(isOpen) => setIsUserMenuOpen(isOpen)}
            popperProps={{ position: 'right' }}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                isFullHeight
              >
                merajput
              </MenuToggle>
            )}
          >
            <DropdownList>
              <DropdownItem>User management</DropdownItem>
              <Divider />
              <DropdownItem>Logout</DropdownItem>
            </DropdownList>
          </Dropdown>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const Header = (
    <Masthead id="readonly-console-masthead">
      <MastheadToggle>
        <PageToggleButton variant="plain" aria-label="Global navigation" id="vertical-nav-toggle">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand component="a" href="#">
          <div className="pf-v5-c-brand-logo">
            <svg className="pf-v5-c-brand__logo" width="200" height="40" viewBox="0 0 200 40">
              {/* Red Hat logo */}
              <g>
                <path
                  d="M12 12 L20 8 L28 12 L28 20 L20 24 L12 20 Z"
                  fill="#EE0000"
                />
                <path
                  d="M16 14 L20 12 L24 14 L24 18 L20 20 L16 18 Z"
                  fill="#CC0000"
                />
              </g>
              <text x="35" y="18" fill="currentColor" fontSize="13" fontWeight="600">
                Red Hat
              </text>
              <text x="35" y="30" fill="currentColor" fontSize="11" fontWeight="400">
                OpenShift
              </text>
              <rect x="100" y="12" width="60" height="16" rx="2" fill="rgba(62, 134, 53, 0.15)" stroke="#3e8635" strokeWidth="1"/>
              <text x="130" y="23" fill="#7dc242" fontSize="9" fontWeight="700" textAnchor="middle">
                DEDICATED
              </text>
            </svg>
          </div>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{HeaderToolbar}</MastheadContent>
    </Masthead>
  );

  return (
    <Page
      header={Header}
      sidebar={<Sidebar />}
      isManagedSidebar
      defaultManagedSidebarIsOpen
    >
      <PageSection
        padding={{ default: 'padding', md: 'padding' }}
        style={{
          backgroundColor: 'var(--pf-v5-global--BackgroundColor--dark-300)',
          borderBottom: '1px solid var(--pf-v5-global--BorderColor--100)',
        }}
      >
        <NamespaceSelector />
      </PageSection>
      <PageSection>
        <Routes>
          <Route path="/" element={<Navigate to="/pods" replace />} />
          <Route path="/home" element={<HomeOverview />} />
          <Route path="/pods" element={<PodsList />} />
          <Route path="/deployments" element={<DeploymentsList />} />
          <Route path="/services" element={<ServicesList />} />
        </Routes>
      </PageSection>
    </Page>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NamespaceProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </NamespaceProvider>
    </QueryClientProvider>
  );
}
