"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { MonitoredAccount } from "@/types/launch-detector"
import { getInitials } from "@/lib/ui-helpers" // Assuming this helper exists
import { ScrollArea } from "@/components/ui/scroll-area"

interface MonitoredAccountsManagerProps {
    initialAccounts: MonitoredAccount[];
    onAccountListChange: (accounts: MonitoredAccount[]) => void; // Callback to update parent state
}

export function MonitoredAccountsManager({ initialAccounts, onAccountListChange }: MonitoredAccountsManagerProps) {
    const [accounts, setAccounts] = useState<MonitoredAccount[]>(initialAccounts);
    const [newUsername, setNewUsername] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const { toast } = useToast();

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;

        setIsAdding(true);
        const usernameToAdd = newUsername.trim().startsWith("@") ? newUsername.trim().substring(1) : newUsername.trim();

        try {
            const response = await fetch('/api/monitored-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameToAdd }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to add account (Status: ${response.status})`);
            }

            const newAccount = result as MonitoredAccount;
            // Add only if it doesn't already exist in the state
            if (!accounts.some(acc => acc.id === newAccount.id)) {
                const updatedAccounts = [...accounts, newAccount];
                setAccounts(updatedAccounts);
                onAccountListChange(updatedAccounts); // Update parent
            }
            setNewUsername("");
            toast({
                title: "Account Added",
                description: `@${usernameToAdd} is now being monitored.`,
            });

        } catch (error: any) {
            console.error("Error adding account:", error);
            toast({
                title: "Error Adding Account",
                description: error.message || "Could not add the account.",
                variant: "destructive",
            });
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveAccount = async (userId: string, username: string) => {
        setRemovingId(userId);
        try {
            const response = await fetch(`/api/monitored-accounts?userId=${userId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to remove account (Status: ${response.status})`);
            }

            const updatedAccounts = accounts.filter(acc => acc.id !== userId);
            setAccounts(updatedAccounts);
            onAccountListChange(updatedAccounts); // Update parent
            toast({
                title: "Account Removed",
                description: `@${username} is no longer monitored.`,
            });

        } catch (error: any) {
            console.error("Error removing account:", error);
            toast({
                title: "Error Removing Account",
                description: error.message || "Could not remove the account.",
                variant: "destructive",
            });
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monitored Accounts</CardTitle>
                <CardDescription>Add Twitter/X usernames to scan for launch announcements.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddAccount} className="flex gap-2 mb-6">
                    <Input
                        placeholder="@username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={isAdding}
                        className="max-w-xs"
                    />
                    <Button type="submit" disabled={isAdding || !newUsername.trim()}>
                        {isAdding ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        Add Account
                    </Button>
                </form>

                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Currently Monitoring:</h4>
                <ScrollArea className="h-[250px] pr-4">
                    {accounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No accounts added yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map((account) => (
                                <div key={account.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            {/* Placeholder - Fetch image URL if needed */}
                                            {/* <AvatarImage src={account.profile_image_url} /> */}
                                            <AvatarFallback>{getInitials(account.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm">{account.name}</div>
                                            <div className="text-xs text-muted-foreground">@{account.username}</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveAccount(account.id, account.username)}
                                        disabled={removingId === account.id}
                                        aria-label={`Remove ${account.username}`}
                                    >
                                        {removingId === account.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
} 