import React from 'react';
import { createWeb3Modal } from '@web3modal/wagmi';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './utils/web3Config';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Toaster } from 'sonner';

// Create QueryClient for React Query
const queryClient = new QueryClient();

// Configure Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  featuredWalletIds: [],
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
    '--w3m-border-radius-master': '12px',
  },
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-center" richColors closeButton />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
