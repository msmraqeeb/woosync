"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [editStatus, setEditStatus] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
    const [inlineSaving, setInlineSaving] = useState(false);

    // Detailed Edit State
    const [editBilling, setEditBilling] = useState<any>({});
    const [editLineItems, setEditLineItems] = useState<any[]>([]);
    const [newLineItems, setNewLineItems] = useState<any[]>([]);
    const [editShippingTotal, setEditShippingTotal] = useState("");

    // Product Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/orders?per_page=20");
            const json = await res.json();
            if (json.orders) setOrders(json.orders);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (order: any) => {
        setEditingOrder(order);
        setEditStatus(order.status);
        setEditBilling(order.billing || {});

        // Deep clone line items for editing
        setEditLineItems(order.line_items ? JSON.parse(JSON.stringify(order.line_items)) : []);
        setNewLineItems([]);

        // Find total shipping
        const shippingLine = order.shipping_lines?.[0];
        setEditShippingTotal(shippingLine?.total || "0");

        setSearchQuery("");
        setSearchResults([]);
        setIsDialogOpen(true);
    };

    const searchProducts = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&per_page=5`);
            const json = await res.json();
            if (json.products) {
                // If any of the products are variable, fetch their variations
                let finalResults: any[] = [];
                for (const p of json.products) {
                    if (p.type === "variable") {
                        try {
                            const varRes = await fetch(`/api/products/${p.id}/variations`);
                            const varJson = await varRes.json();
                            if (Array.isArray(varJson)) {
                                // Add variation details so they look like regular products
                                finalResults = [...finalResults, ...varJson.map((v: any) => ({
                                    ...v,
                                    name: `${p.name} - ${v.attributes.map((a: any) => a.option).join(', ')}`,
                                    parentId: p.id,
                                }))];
                            }
                        } catch (e) {
                            console.error("Failed fetching variations for " + p.id, e);
                        }
                    } else {
                        finalResults.push(p);
                    }
                }
                setSearchResults(finalResults);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSaveOrder = async () => {
        if (!editingOrder) return;
        setSaving(true);
        try {
            const allLineItems = [...editLineItems, ...newLineItems];

            const reqBody: any = {
                status: editStatus,
                billing: editBilling,
                line_items: allLineItems.map(item => ({
                    id: item.id || undefined, // undefined for new items
                    product_id: item.product_id,
                    variation_id: item.variation_id || undefined,
                    quantity: parseInt(item.quantity || 0),
                    // If total is provided without subtotal, WC calculates the unit price. 
                    // We multiply price * qty to get the line total.
                    total: String(parseFloat(item.price || item.total || 0) * parseInt(item.quantity || 0))
                })),
            };

            // Process Shipping
            if (editingOrder.shipping_lines?.length > 0) {
                reqBody.shipping_lines = [
                    {
                        id: editingOrder.shipping_lines[0].id,
                        total: editShippingTotal
                    }
                ];
            } else if (parseFloat(editShippingTotal) > 0) {
                reqBody.shipping_lines = [
                    {
                        method_id: "flat_rate",
                        method_title: "Flat Rate",
                        total: editShippingTotal
                    }
                ];
            }

            const res = await fetch(`/api/orders/${editingOrder.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqBody),
            });

            if (res.ok) {
                fetchOrders();
                setIsDialogOpen(false);
            } else {
                console.error("Failed to update order");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleInlineStatusUpdate = async (orderId: number, newStatus: string) => {
        setInlineSaving(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            if (res.ok) {
                // Optimistic update
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            } else {
                console.error("Failed to update order inline");
                fetchOrders(); // Revert on failure
            }
        } catch (e) {
            console.error(e);
            fetchOrders(); // Revert on failure
        } finally {
            setInlineSaving(false);
            setInlineEditingId(null);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Orders</h1>
            </div>
            <div className="flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm">
                <Card className="w-full border-none shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>
                                Manage your orders and update fulfillment statuses.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Loading orders...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>
                                                {order.billing?.first_name} {order.billing?.last_name}
                                            </TableCell>
                                            <TableCell>
                                                {inlineEditingId === order.id ? (
                                                    <Select
                                                        defaultOpen
                                                        value={order.status}
                                                        onValueChange={(val) => handleInlineStatusUpdate(order.id, val || "")}
                                                        onOpenChange={(open) => {
                                                            if (!open) setInlineEditingId(null);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 w-[140px]" disabled={inlineSaving}>
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending Payment</SelectItem>
                                                            <SelectItem value="processing">Processing</SelectItem>
                                                            <SelectItem value="on-hold">On Hold</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                                            <SelectItem value="refunded">Refunded</SelectItem>
                                                            <SelectItem value="failed">Failed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => setInlineEditingId(order.id)}
                                                        title="Click to edit"
                                                    >
                                                        {(() => {
                                                            const colorMap: Record<string, string> = {
                                                                completed: "bg-green-100 text-green-800 hover:bg-green-100/80 border-transparent",
                                                                processing: "bg-[#cce5ff] text-[#004085] hover:bg-[#b8daff] border-transparent", // WooCommerce typical blue
                                                                cancelled: "bg-neutral-200 text-neutral-600 hover:bg-neutral-200/80 border-transparent",
                                                                failed: "bg-red-100 text-red-800 hover:bg-red-100/80 border-transparent",
                                                                refunded: "bg-orange-100 text-orange-800 hover:bg-orange-100/80 border-transparent",
                                                                "on-hold": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-transparent",
                                                                pending: "bg-zinc-100 text-zinc-800 border-zinc-200", // Outline-ish
                                                            };

                                                            const displayNames: Record<string, string> = {
                                                                "pending": "Pending Payment",
                                                                "on-hold": "On Hold"
                                                            };

                                                            return (
                                                                <Badge className={colorMap[order.status] || "bg-zinc-100 text-zinc-800"}>
                                                                    {displayNames[order.status] || order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                                </Badge>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {new Date(order.date_created).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>৳{order.total}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(order)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit Status</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {orders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                No orders found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Update Order #{editingOrder?.id}</DialogTitle>
                        <DialogDescription>
                            Edit customer details, add/remove items, and manage shipping.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="customer">Customer</TabsTrigger>
                            <TabsTrigger value="products">Products</TabsTrigger>
                            <TabsTrigger value="shipping">Shipping</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Order Status</Label>
                                    <Select value={editStatus} onValueChange={(val) => setEditStatus(val || "")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending Payment</SelectItem>
                                            <SelectItem value="processing">Processing</SelectItem>
                                            <SelectItem value="on-hold">On Hold</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="refunded">Refunded</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="customer" className="mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input
                                        value={editBilling.first_name || ""}
                                        onChange={(e) => setEditBilling({ ...editBilling, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input
                                        value={editBilling.last_name || ""}
                                        onChange={(e) => setEditBilling({ ...editBilling, last_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={editBilling.email || ""}
                                        onChange={(e) => setEditBilling({ ...editBilling, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={editBilling.phone || ""}
                                        onChange={(e) => setEditBilling({ ...editBilling, phone: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={editBilling.address_1 || ""}
                                        onChange={(e) => setEditBilling({ ...editBilling, address_1: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        value={editBilling.city || ""}
                                        onChange={(e) => setEditBilling({ ...editBilling, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Postcode</Label>
                                    <Input
                                        value={editBilling.postcode || ""}
                                        onChange={(e) => setEditBilling({ ...editBilling, postcode: e.target.value })}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="products" className="mt-4 space-y-4">
                            {/* Product Search */}
                            <div className="relative border rounded-md p-4 bg-muted/20">
                                <Label className="mb-2 block">Add Product</Label>
                                <div className="flex gap-2 relative">
                                    <Input
                                        placeholder="Search for a product to add..."
                                        value={searchQuery}
                                        onChange={(e) => searchProducts(e.target.value)}
                                        className="w-full"
                                    />
                                    <Button disabled variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>

                                    {searchResults.length > 0 && (
                                        <div className="absolute top-12 left-0 w-full bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                            {searchResults.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className="p-2 border-b cursor-pointer hover:bg-muted flex justify-between items-center"
                                                    onClick={() => {
                                                        const exists = editLineItems.find((el: any) =>
                                                            (el.variation_id && el.variation_id === p.id) ||
                                                            (!el.variation_id && el.product_id === p.id)
                                                        ) || newLineItems.find((el: any) =>
                                                            (el.variation_id && el.variation_id === p.id) ||
                                                            (!el.variation_id && el.product_id === p.id)
                                                        );

                                                        if (!exists) {
                                                            const newItem: any = {
                                                                name: p.name,
                                                                product_id: p.parentId || p.id,
                                                                quantity: 1,
                                                                price: p.price,
                                                                total: p.price
                                                            };

                                                            if (p.parentId) {
                                                                newItem.variation_id = p.id;
                                                            }

                                                            setNewLineItems([...newLineItems, newItem]);
                                                        }
                                                        setSearchResults([]);
                                                        setSearchQuery("");
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span>{p.name}</span>
                                                        <span className="text-muted-foreground text-xs">({p.sku})</span>
                                                    </div>
                                                    <span className="text-sm font-medium">৳{p.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="border rounded-md mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="w-24">Price (৳)</TableHead>
                                            <TableHead className="w-24">Qty</TableHead>
                                            <TableHead className="w-24">Total (৳)</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Existing Items */}
                                        {editLineItems.filter((i: any) => parseInt(i.quantity) > 0).map((item, idx) => (
                                            <TableRow key={`existing-${item.id || idx}`}>
                                                <TableCell className="font-medium text-sm">{item.name}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8"
                                                        value={item.price || item.total / item.quantity || 0}
                                                        onChange={(e) => {
                                                            const newItems = [...editLineItems];
                                                            newItems[idx].price = e.target.value;
                                                            setEditLineItems(newItems);
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const newItems = [...editLineItems];
                                                            newItems[idx].quantity = e.target.value;
                                                            setEditLineItems(newItems);
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm bg-muted/20">
                                                    {(parseFloat(item.price || item.total / item.quantity || 0) * parseInt(item.quantity || 0)).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                        onClick={() => {
                                                            const newItems = [...editLineItems];
                                                            // Set quantity to 0 to mark for deletion in API
                                                            newItems[idx].quantity = 0;
                                                            setEditLineItems(newItems);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* New Items */}
                                        {newLineItems.map((item, idx) => (
                                            <TableRow key={`new-${idx}`} className="bg-primary/5">
                                                <TableCell className="font-medium text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1">NEW</Badge>
                                                        {item.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8"
                                                        value={item.price || 0}
                                                        onChange={(e) => {
                                                            const newItems = [...newLineItems];
                                                            newItems[idx].price = e.target.value;
                                                            setNewLineItems(newItems);
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const newItems = [...newLineItems];
                                                            newItems[idx].quantity = e.target.value;
                                                            setNewLineItems(newItems);
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm bg-muted/20">
                                                    {(parseFloat(item.price || 0) * parseInt(item.quantity || 0)).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                        onClick={() => {
                                                            setNewLineItems(newLineItems.filter((_, i) => i !== idx));
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {editLineItems.filter((i: any) => parseInt(i.quantity) > 0).length === 0 && newLineItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">No items in this order. Products will be deleted on save.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="shipping" className="mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Shipping Cost (৳)</Label>
                                    <Input
                                        type="number"
                                        value={editShippingTotal}
                                        onChange={(e) => setEditShippingTotal(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Adjusting the shipping cost here will update the order total.</p>
                                </div>
                            </div>
                        </TabsContent>

                    </Tabs>

                    <DialogFooter className="mt-4">
                        <Button disabled={saving} onClick={handleSaveOrder}>
                            {saving ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
