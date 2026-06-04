/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StorageProvider, useStorage } from './components/StorageContext';
import { PublicLanding } from './components/PublicLanding';
import { LoginPortal } from './components/LoginPortal';
import { AdminConsole } from './components/AdminConsole';
import { ClientDashboard } from './components/ClientDashboard';
import { InviteLanding } from './components/InviteLanding';

function AppInner() {
  const { currentView } = useStorage();

  switch (currentView) {
    case 'login':
      return <LoginPortal />;
    case 'admin':
      return <AdminConsole />;
    case 'client-dashboard':
      return <ClientDashboard />;
    case 'invite-landing':
      return <InviteLanding />;
    case 'public':
    default:
      return <PublicLanding />;
  }
}

export default function App() {
  return (
    <StorageProvider>
      <AppInner />
    </StorageProvider>
  );
}
