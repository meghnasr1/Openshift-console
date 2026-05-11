import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Page,
  PageHeader,
  PageSidebar,
  PageSection,
  Nav,
  NavList,
  NavItem,
  Brand,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Title,
} from '@patternfly/react-core';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NamespaceProvider } from './hooks/useNamespace';
import { NamespaceSelector } from './components/NamespaceSelector';
import { PodsList } from './components/PodsList';
import { DeploymentsList } from './components/DeploymentsList';
import { ServicesList } from './components/ServicesList';
import '@patternfly/react-core/dist/styles/base.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Navigation() {
  const location = useLocation();

  return (
    <Nav aria-label="Nav" theme="dark">
      <NavList>
        <NavItem isActive={location.pathname === '/pods'}>
          <Link to="/pods" style={{ color: 'inherit', textDecoration: 'none' }}>
            Pods
          </Link>
        </NavItem>
        <NavItem isActive={location.pathname === '/deployments'}>
          <Link to="/deployments" style={{ color: 'inherit', textDecoration: 'none' }}>
            Deployments
          </Link>
        </NavItem>
        <NavItem isActive={location.pathname === '/services'}>
          <Link to="/services" style={{ color: 'inherit', textDecoration: 'none' }}>
            Services
          </Link>
        </NavItem>
      </NavList>
    </Nav>
  );
}

function AppContent() {
  const Header = (
    <PageHeader
      logo={<Brand src="" alt="K8s Console" />}
      logoComponent="div"
      headerTools={
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Title headingLevel="h1" size="xl">
                Read-Only Kubernetes Console
              </Title>
            </ToolbarItem>
            <ToolbarItem>
              <NamespaceSelector />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      }
    />
  );

  const Sidebar = <PageSidebar nav={<Navigation />} theme="dark" />;

  return (
    <Page header={Header} sidebar={Sidebar}>
      <PageSection>
        <Routes>
          <Route path="/" element={<PodsList />} />
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
