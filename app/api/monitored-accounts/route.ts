import { NextResponse } from 'next/server'
import { getMonitoredAccounts } from '@/lib/db-service'; // <<< CORRECTED PATH
import {
    addAccountToMonitor,
    removeAccountFromMonitor
} from '@/lib/launch-detection-service'; // Adjust path if needed

// GET: Fetch current list of monitored accounts
export async function GET() {
    try {
        const accounts = await getMonitoredAccounts();
        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json({ error: `Failed to fetch monitored accounts: ${error.message}` }, { status: 500 });
    }
}

// POST: Add a new account to monitor
export async function POST(request: Request) {
    try {
        const { username } = await request.json();
        if (!username || typeof username !== 'string') {
            return NextResponse.json({ error: 'Username is required and must be a string' }, { status: 400 });
        }
        const result = await addAccountToMonitor(username);
        if (!result.success) {
             // Distinguish between user not found (404) and other errors (500)
             const status = result.message.includes("not found") ? 404 : 500;
            return NextResponse.json({ error: result.message }, { status });
        }
        return NextResponse.json(result.account, { status: 201 }); // Return the added account info
    } catch (error: any) {
        return NextResponse.json({ error: `Failed to add monitored account: ${error.message}` }, { status: 500 });
    }
}

// DELETE: Remove an account from monitoring
export async function DELETE(request: Request) {
     try {
         // Get userId from query parameters or request body
         const { searchParams } = new URL(request.url);
         const userId = searchParams.get('userId');
         // Or: const { userId } = await request.json();

         if (!userId || typeof userId !== 'string') {
             return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
         }
         const result = await removeAccountFromMonitor(userId);
         if (!result.success) {
             return NextResponse.json({ error: result.message }, { status: 500 });
         }
         return NextResponse.json({ message: result.message }, { status: 200 });
     } catch (error: any) {
         return NextResponse.json({ error: `Failed to remove monitored account: ${error.message}` }, { status: 500 });
     }
} 