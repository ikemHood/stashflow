import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { AppKitProvider } from './providers/AppKitProvider'
import { Toaster } from 'sonner';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1, // Only retry once
      refetchOnWindowFocus: import.meta.env.PROD, // Only in production
    },
  },
});

function App() {
  return (
    <AppKitProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-center" richColors closeButton />
        <RouterProvider router={router} />
        {/* Add the react query dev tools in development mode */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </AppKitProvider>
  );
}

export default App;
