"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useState } from "react";
import { FallingBlocksBackground } from "~/components/falling-blocks-background";
import { Toaster } from "~/components/ui/sonner";
import { MusicProvider } from "~/components/music-provider";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnMount: true,
            staleTime: Infinity,
        },
    },
});

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: createTRPCHttpBatchClientClient(),
        }),
    );
    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="light"
                forcedTheme="light"
                enableSystem={false}
                disableTransitionOnChange
            >
                <trpc.Provider queryClient={queryClient} client={trpcClient}>
                    <MusicProvider>
                        <FallingBlocksBackground />
                        <div className="relative z-[1] min-h-screen">{children}</div>
                        <Toaster />
                    </MusicProvider>
                </trpc.Provider>
            </NextThemesProvider>
        </QueryClientProvider>
    );
};
