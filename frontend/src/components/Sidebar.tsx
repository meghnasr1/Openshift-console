import {
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  NavGroup,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { CogIcon } from '@patternfly/react-icons';

export function Sidebar() {
  const location = useLocation();
  const [isPerspectiveOpen, setIsPerspectiveOpen] = useState(false);

  const PageNav = (
    <Nav aria-label="Global" theme="dark">
      <Stack hasGutter style={{ padding: 'var(--pf-v5-global--spacer--md)' }}>
        <StackItem>
          <Dropdown
            isOpen={isPerspectiveOpen}
            onSelect={() => setIsPerspectiveOpen(false)}
            onOpenChange={(isOpen) => setIsPerspectiveOpen(isOpen)}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setIsPerspectiveOpen(!isPerspectiveOpen)}
                isFullWidth
                isExpanded={isPerspectiveOpen}
                icon={<CogIcon />}
              >
                Administrator
              </MenuToggle>
            )}
          >
            <DropdownList>
              <DropdownItem value="admin" key="admin">
                Administrator
              </DropdownItem>
              <DropdownItem value="dev" key="dev">
                Developer
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        </StackItem>
        <StackItem>
          <NavList>
            <NavItem
              preventDefault
              to="/home"
              itemId="home"
              isActive={location.pathname === '/home'}
            >
              <Link to="/home" className="pf-v5-c-nav__link">
                Home
              </Link>
            </NavItem>
          </NavList>
        </StackItem>
        <StackItem>
          <NavGroup title="Workloads" id="nav-group-workloads">
            <NavItem preventDefault itemId="pods" isActive={location.pathname === '/pods'}>
              <Link to="/pods" className="pf-v5-c-nav__link">
                Pods
              </Link>
            </NavItem>
            <NavItem preventDefault itemId="deployments" isActive={location.pathname === '/deployments'}>
              <Link to="/deployments" className="pf-v5-c-nav__link">
                Deployments
              </Link>
            </NavItem>
            <NavItem preventDefault itemId="services" isActive={location.pathname === '/services'}>
              <Link to="/services" className="pf-v5-c-nav__link">
                Services
              </Link>
            </NavItem>
          </NavGroup>
        </StackItem>
        <StackItem>
          <NavList>
            <NavItem itemId="networking">Networking</NavItem>
            <NavItem itemId="storage">Storage</NavItem>
            <NavItem itemId="builds">Builds</NavItem>
            <NavItem itemId="pipelines">Pipelines</NavItem>
            <NavItem itemId="observe">Observe</NavItem>
          </NavList>
        </StackItem>
      </Stack>
    </Nav>
  );

  return (
    <PageSidebar theme="dark">
      <PageSidebarBody>{PageNav}</PageSidebarBody>
    </PageSidebar>
  );
}
