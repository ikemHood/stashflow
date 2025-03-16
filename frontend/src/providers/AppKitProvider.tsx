import React, { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { wagmiAdapter } from '../lib/appkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client
const queryClient = new QueryClient();

interface AppKitProviderProps {
    children: ReactNode;
}

export function AppKitProvider({ children }: AppKitProviderProps) {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
} 