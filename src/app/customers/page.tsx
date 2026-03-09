"use client";

import { useEffect, useState } from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/customers?per_page=20");
            const json = await res.json();
            if (json.error) {
                setError(json.error);
            } else if (json.customers) {
                setCustomers(json.customers);
                setError(null);
            }
        } catch (e: any) {
            console.error(e);
            setError("Failed to fetch customers: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4">
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm font-medium">
                    ⚠️ Error: {error}
                </div>
            )}
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Customers</h1>
            </div>
            <div className="flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm">
                <Card className="w-full border-none shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Customer Directory</CardTitle>
                            <CardDescription>
                                View all your registered customers from WooCommerce.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Loading customers...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="hidden md:table-cell">Role</TableHead>
                                        <TableHead className="hidden md:table-cell">Total Spent</TableHead>
                                        <TableHead className="hidden sm:table-cell">Date Registered</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={customer.avatar_url} alt={customer.first_name} />
                                                    <AvatarFallback>{customer.first_name?.[0] || customer.username?.[0] || "C"}</AvatarFallback>
                                                </Avatar>
                                                <span>
                                                    {customer.first_name} {customer.last_name || ""}
                                                    {!customer.first_name && !customer.last_name && customer.username}
                                                </span>
                                            </TableCell>
                                            <TableCell>{customer.email}</TableCell>
                                            <TableCell className="hidden md:table-cell capitalize">
                                                {customer.role}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {customer.is_paying_customer ? "Yes" : "No"}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {new Date(customer.date_created).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {customers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                No customers found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
