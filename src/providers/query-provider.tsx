"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
    children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5, // 5 minutes
                        gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
                        retry: (failureCount, error) => {
                            // Don't retry on 4xx errors
                            if (error instanceof Error && 'status' in error) {
                                const status = (error as any).status;
                                if (status >= 400 && status < 500) {
                                    return false;
                                }
                            }
                            return failureCount < 3;
                        },
                        refetchOnWindowFocus: false,
                        refetchOnReconnect: 'always',
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools
                initialIsOpen={false}
                buttonPosition="bottom-left"
            />
        </QueryClientProvider>
    );
} 