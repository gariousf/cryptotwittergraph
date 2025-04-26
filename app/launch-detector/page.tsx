"use client"; // This page needs client-side interaction for the manager

import { useState, useEffect } from 'react';
import { MonitoredAccountsManager } from "../components/monitored-accounts-manager";
import { LaunchDetectorDisplay } from "../components/launch-detector-display";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoredAccount } from "@/types/launch-detector";
import { Toaster } from "@/components/ui/toaster" // Add toaster for notifications

// Function to fetch initial accounts (replace with API route/server action if needed)
async function fetchInitialAccounts(): Promise<MonitoredAccount[]> {
     try {
        const response = await fetch('/api/monitored-accounts'); // Use the API route
        if (!response.ok) {
            throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching initial monitored accounts:", error);
        return [];
    }
}

export default function LaunchDetectorPage() {
    const [monitoredAccounts, setMonitoredAccounts] = useState<MonitoredAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const accounts = await fetchInitialAccounts();
                setMonitoredAccounts(accounts);
            } catch (err) {
                setError("Failed to load initial account list.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Callback for the manager component to update the list in this parent state if needed
    const handleAccountListChange = (updatedAccounts: MonitoredAccount[]) => {
        setMonitoredAccounts(updatedAccounts);
    };

    return (
        <main className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Token Launch Detector</h1>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Account Management Panel */}
                <div className="lg:col-span-1">
                    {isLoading ? (
                         <Skeleton className="h-[400px] w-full" />
                    ) : error ? (
                         <p className="text-red-500">{error}</p>
                    ) : (
                        <MonitoredAccountsManager
                            initialAccounts={monitoredAccounts}
                            onAccountListChange={handleAccountListChange}
                        />
                    )}
                </div>

                {/* Detected Launches Display */}
                <div className="lg:col-span-2">
                    {/* LaunchDetectorDisplay handles its own loading/fetching */}
                    <LaunchDetectorDisplay />
                </div>
            </div>
            <Toaster /> {/* Add Toaster component here to show notifications */}
        </main>
    );
} 