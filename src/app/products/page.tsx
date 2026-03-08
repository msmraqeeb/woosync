"use client";

import { useEffect, useState, Fragment } from "react";
import { Package, PlusCircle, Search, Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editPrice, setEditPrice] = useState("");
    const [editStock, setEditStock] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Inline editing state
    const [inlineEditing, setInlineEditing] = useState<{ id: number, field: 'name' | 'sku' | 'status' | 'regular_price' | 'stock_quantity', isVariation?: boolean, parentId?: number } | null>(null);
    const [inlineValue, setInlineValue] = useState("");
    const [inlineSaving, setInlineSaving] = useState(false);

    // Variable product state
    const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
    const [productVariations, setProductVariations] = useState<Record<number, any[]>>({});
    const [loadingVariations, setLoadingVariations] = useState<Record<number, boolean>>({});

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [inputPage, setInputPage] = useState("1");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (debouncedSearch !== "") {
            setPage(1); // Set to page 1 on search change. We avoid setting page unconditionally on debounce, which avoids refetched duplicates.
        }
        fetchProducts(page, debouncedSearch);
    }, [page, debouncedSearch]);

    const fetchProducts = async (currentPage: number, search: string = "") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products?page=${currentPage}&per_page=20&search=${encodeURIComponent(search)}`);
            const json = await res.json();
            if (json.products) {
                setProducts(json.products);
                setTotalPages(parseInt(json.totalPages) || 1);
                setTotalItems(parseInt(json.total) || 0);
                setInputPage(currentPage.toString());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpandProduct = async (productId: number) => {
        const isExpanded = expandedProducts[productId];
        if (isExpanded) {
            setExpandedProducts(prev => ({ ...prev, [productId]: false }));
            return;
        }

        setExpandedProducts(prev => ({ ...prev, [productId]: true }));

        if (!productVariations[productId]) {
            setLoadingVariations(prev => ({ ...prev, [productId]: true }));
            try {
                const res = await fetch(`/api/products/${productId}/variations`);
                const variations = await res.json();
                setProductVariations(prev => ({ ...prev, [productId]: variations }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingVariations(prev => ({ ...prev, [productId]: false }));
            }
        }
    };

    const handleEditClick = (product: any, parentId?: number) => {
        setEditingProduct(parentId ? { ...product, parent_id: parentId } : product);
        setEditPrice(product.regular_price || "0");
        setEditStock(product.stock_quantity?.toString() || "0");
        setIsDialogOpen(true);
    };

    const handleSaveProduct = async () => {
        if (!editingProduct) return;
        setSaving(true);
        try {
            const endpoint = editingProduct.parent_id
                ? `/api/products/${editingProduct.parent_id}/variations/${editingProduct.id}`
                : `/api/products/${editingProduct.id}`;

            const res = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    regular_price: editPrice,
                    manage_stock: true,
                    stock_quantity: parseInt(editStock),
                }),
            });

            if (res.ok) {
                if (editingProduct.parent_id) {
                    // Refetch variations
                    const varRes = await fetch(`/api/products/${editingProduct.parent_id}/variations`);
                    const variations = await varRes.json();
                    setProductVariations(prev => ({ ...prev, [editingProduct.parent_id]: variations }));
                } else {
                    fetchProducts(page, debouncedSearch);
                }
                setIsDialogOpen(false);
            } else {
                console.error("Failed to update product");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleInlineSave = async (product: any, field: 'name' | 'sku' | 'status' | 'regular_price' | 'stock_quantity', isVariation: boolean = false, parentId?: number, overrideValue?: string) => {
        const valueToSave = overrideValue !== undefined ? overrideValue : inlineValue;
        const currentValue = field === 'regular_price' ? product.price : (field === 'stock_quantity' ? product.stock_quantity?.toString() : product[field]);
        if (valueToSave === currentValue) {
            setInlineEditing(null);
            return;
        }

        setInlineSaving(true);
        try {
            const body: any = { [field]: field === 'stock_quantity' ? parseInt(valueToSave) : valueToSave };
            if (field === 'stock_quantity') body.manage_stock = true;

            const endpoint = isVariation && parentId
                ? `/api/products/${parentId}/variations/${product.id}`
                : `/api/products/${product.id}`;

            const res = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                // Optimistic update
                const newValue = field === 'stock_quantity' ? parseInt(valueToSave) : valueToSave;

                if (isVariation && parentId) {
                    setProductVariations(prev => ({
                        ...prev,
                        [parentId]: prev[parentId]?.map(p => {
                            if (p.id === product.id) {
                                return {
                                    ...p,
                                    [field]: newValue,
                                    price: field === 'regular_price' ? inlineValue : p.price,
                                    stock_quantity: field === 'stock_quantity' ? newValue : p.stock_quantity
                                };
                            }
                            return p;
                        }) || []
                    }));
                } else {
                    setProducts(products.map(p => {
                        if (p.id === product.id) {
                            return {
                                ...p,
                                [field]: newValue,
                                price: field === 'regular_price' ? inlineValue : p.price,
                                stock_quantity: field === 'stock_quantity' ? newValue : p.stock_quantity
                            };
                        }
                        return p;
                    }));
                }
                setInlineEditing(null);
            } else {
                console.error("Failed to update product inline");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setInlineSaving(false);
        }
    };

    const paginationControls = (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground w-full justify-end sm:w-auto mt-4 sm:mt-0">
            <div className="mr-2">
                {totalItems.toLocaleString()} items
            </div>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setPage(1)}
                disabled={page <= 1 || loading}
            >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First page</span>
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
            </Button>

            <Input
                type="number"
                min={1}
                max={totalPages}
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onBlur={() => {
                    let p = parseInt(inputPage);
                    if (isNaN(p) || p < 1) p = 1;
                    if (totalPages > 0 && p > totalPages) p = totalPages;
                    setPage(p);
                    setInputPage(p.toString());
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        let p = parseInt(inputPage);
                        if (isNaN(p) || p < 1) p = 1;
                        if (totalPages > 0 && p > totalPages) p = totalPages;
                        setPage(p);
                        setInputPage(p.toString());
                    }
                }}
                className="h-8 w-14 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex-shrink-0"
                disabled={loading}
                style={{ MozAppearance: 'textfield' }}
            />
            <span className="mx-2 text-sm whitespace-nowrap">of {totalPages}</span>

            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
            >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
            >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last page</span>
            </Button>
        </div>
    );

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Products</h1>
            </div>
            <div
                className="flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm"
                x-chunk="dashboard-02-chunk-1"
            >
                <Card className="w-full border-none shadow-none">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Inventory</CardTitle>
                            <CardDescription>
                                Manage your products and view their sales performance.
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search name or SKU..."
                                    className="w-full rounded-lg bg-background pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {paginationControls}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Loading products...</div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Image</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Stock
                                            </TableHead>
                                            <TableHead>
                                                <span className="sr-only">Actions</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product) => (
                                            <Fragment key={product.id}>
                                                <TableRow>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {product.type === "variable" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 shrink-0"
                                                                    onClick={() => toggleExpandProduct(product.id)}
                                                                >
                                                                    {expandedProducts[product.id] ? (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            )}
                                                            <img
                                                                alt="Product image"
                                                                className="aspect-square rounded-md object-cover"
                                                                height="64"
                                                                src={product.images?.[0]?.src || "https://ui.shadcn.com/placeholder.svg"}
                                                                width="64"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {inlineEditing?.id === product.id && inlineEditing?.field === 'name' && !inlineEditing.isVariation ? (
                                                            <Input
                                                                autoFocus
                                                                value={inlineValue}
                                                                onChange={(e) => setInlineValue(e.target.value)}
                                                                onBlur={() => handleInlineSave(product, 'name')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleInlineSave(product, 'name');
                                                                    if (e.key === 'Escape') setInlineEditing(null);
                                                                }}
                                                                className="w-full h-8 min-w-[12rem]"
                                                                disabled={inlineSaving}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-md min-w-[3rem] transition-colors"
                                                                onClick={() => {
                                                                    setInlineEditing({ id: product.id, field: 'name' });
                                                                    setInlineValue(product.name || "");
                                                                }}
                                                                title="Click to edit"
                                                            >
                                                                {product.name}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {inlineEditing?.id === product.id && inlineEditing?.field === 'sku' && !inlineEditing.isVariation ? (
                                                            <Input
                                                                autoFocus
                                                                value={inlineValue}
                                                                onChange={(e) => setInlineValue(e.target.value)}
                                                                onBlur={() => handleInlineSave(product, 'sku')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleInlineSave(product, 'sku');
                                                                    if (e.key === 'Escape') setInlineEditing(null);
                                                                }}
                                                                className="w-full h-8 min-w-[6rem]"
                                                                disabled={inlineSaving}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-md min-w-[3rem] transition-colors"
                                                                onClick={() => {
                                                                    setInlineEditing({ id: product.id, field: 'sku' });
                                                                    setInlineValue(product.sku || "");
                                                                }}
                                                                title="Click to edit"
                                                            >
                                                                {product.sku || <span className="text-muted-foreground italic">N/A</span>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {inlineEditing?.id === product.id && inlineEditing?.field === 'status' && !inlineEditing.isVariation ? (
                                                            <Select
                                                                defaultOpen
                                                                value={inlineValue}
                                                                onValueChange={(val) => {
                                                                    setInlineValue(val || "");
                                                                    handleInlineSave(product, 'status', false, undefined, val || "");
                                                                }}
                                                                onOpenChange={(open) => {
                                                                    if (!open && inlineValue === product.status) setInlineEditing(null);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 w-[110px]" disabled={inlineSaving}>
                                                                    <SelectValue placeholder="Status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="publish">Published</SelectItem>
                                                                    <SelectItem value="draft">Draft</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    setInlineEditing({ id: product.id, field: 'status' });
                                                                    setInlineValue(product.status || "publish");
                                                                }}
                                                                title="Click to edit"
                                                            >
                                                                <Badge
                                                                    variant={product.status === "publish" ? "default" : "secondary"}
                                                                >
                                                                    {product.status === "publish" ? "Published" : product.status}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {product.type === "variable" ? (
                                                            <span className="text-muted-foreground">৳{product.price}</span>
                                                        ) : inlineEditing?.id === product.id && inlineEditing?.field === 'regular_price' && !inlineEditing.isVariation ? (
                                                            <Input
                                                                autoFocus
                                                                type="number"
                                                                value={inlineValue}
                                                                onChange={(e) => setInlineValue(e.target.value)}
                                                                onBlur={() => handleInlineSave(product, 'regular_price')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleInlineSave(product, 'regular_price');
                                                                    if (e.key === 'Escape') setInlineEditing(null);
                                                                }}
                                                                className="w-24 h-8"
                                                                disabled={inlineSaving}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-md min-w-[3rem] transition-colors"
                                                                onClick={() => {
                                                                    setInlineEditing({ id: product.id, field: 'regular_price' });
                                                                    setInlineValue(product.price || "");
                                                                }}
                                                                title="Click to edit"
                                                            >
                                                                ৳{product.price}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {product.type === "variable" ? (
                                                            <span className="text-muted-foreground">Multiple</span>
                                                        ) : inlineEditing?.id === product.id && inlineEditing?.field === 'stock_quantity' && !inlineEditing.isVariation ? (
                                                            <Input
                                                                autoFocus
                                                                type="number"
                                                                value={inlineValue}
                                                                onChange={(e) => setInlineValue(e.target.value)}
                                                                onBlur={() => handleInlineSave(product, 'stock_quantity')}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleInlineSave(product, 'stock_quantity');
                                                                    if (e.key === 'Escape') setInlineEditing(null);
                                                                }}
                                                                className="w-24 h-8"
                                                                disabled={inlineSaving}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-md min-w-[3rem] transition-colors"
                                                                onClick={() => {
                                                                    if (product.type !== 'variable') {
                                                                        setInlineEditing({ id: product.id, field: 'stock_quantity' });
                                                                        setInlineValue(product.stock_quantity?.toString() || "0");
                                                                    }
                                                                }}
                                                                title={product.type === 'variable' ? '' : 'Click to edit'}
                                                            >
                                                                {product.stock_quantity ?? "N/A"}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditClick(product)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Variable Product Variations */}
                                                {product.type === "variable" && expandedProducts[product.id] && (
                                                    loadingVariations[product.id] ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center py-4 text-sm text-muted-foreground bg-muted/10">
                                                                Loading variations...
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        productVariations[product.id]?.map((variation) => (
                                                            <TableRow key={`var-${variation.id}`} className="bg-muted/30">
                                                                <TableCell className="pl-12">
                                                                    <div className="flex items-center gap-2">
                                                                        <img
                                                                            alt="Variation image"
                                                                            className="aspect-square rounded-md object-cover"
                                                                            height="40"
                                                                            src={variation.image?.src || product.images?.[0]?.src || "https://ui.shadcn.com/placeholder.svg"}
                                                                            width="40"
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-medium text-sm text-muted-foreground">
                                                                    ↳ {variation.attributes?.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ') || `Variation #${variation.id}`}
                                                                </TableCell>
                                                                <TableCell className="text-sm">
                                                                    {inlineEditing?.id === variation.id && inlineEditing?.field === 'sku' && inlineEditing.isVariation ? (
                                                                        <Input
                                                                            autoFocus
                                                                            value={inlineValue}
                                                                            onChange={(e) => setInlineValue(e.target.value)}
                                                                            onBlur={() => handleInlineSave(variation, 'sku', true, product.id)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') handleInlineSave(variation, 'sku', true, product.id);
                                                                                if (e.key === 'Escape') setInlineEditing(null);
                                                                            }}
                                                                            className="w-full h-8 min-w-[6rem]"
                                                                            disabled={inlineSaving}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-md min-w-[3rem] transition-colors"
                                                                            onClick={() => {
                                                                                setInlineEditing({ id: variation.id, field: 'sku', isVariation: true, parentId: product.id });
                                                                                setInlineValue(variation.sku || "");
                                                                            }}
                                                                            title="Click to edit"
                                                                        >
                                                                            {variation.sku || <span className="text-muted-foreground italic">N/A</span>}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {inlineEditing?.id === variation.id && inlineEditing?.field === 'status' && inlineEditing.isVariation ? (
                                                                        <Select
                                                                            defaultOpen
                                                                            value={inlineValue}
                                                                            onValueChange={(val) => {
                                                                                setInlineValue(val || "");
                                                                                handleInlineSave(variation, 'status', true, product.id, val || "");
                                                                            }}
                                                                            onOpenChange={(open) => {
                                                                                if (!open && inlineValue === variation.status) setInlineEditing(null);
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className="h-8 w-[90px] text-[10px]" disabled={inlineSaving}>
                                                                                <SelectValue placeholder="Status" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="publish">Published</SelectItem>
                                                                                <SelectItem value="draft">Draft</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    ) : (
                                                                        <div
                                                                            className="cursor-pointer"
                                                                            onClick={() => {
                                                                                setInlineEditing({ id: variation.id, field: 'status', isVariation: true, parentId: product.id });
                                                                                setInlineValue(variation.status || "publish");
                                                                            }}
                                                                            title="Click to edit"
                                                                        >
                                                                            <Badge variant={variation.status === "publish" ? "default" : "secondary"} className="text-[10px] px-1 py-0 h-4">
                                                                                {variation.status === "publish" ? "Published" : variation.status}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {inlineEditing?.id === variation.id && inlineEditing?.field === 'regular_price' && inlineEditing.isVariation ? (
                                                                        <Input
                                                                            autoFocus
                                                                            type="number"
                                                                            value={inlineValue}
                                                                            onChange={(e) => setInlineValue(e.target.value)}
                                                                            onBlur={() => handleInlineSave(variation, 'regular_price', true, product.id)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') handleInlineSave(variation, 'regular_price', true, product.id);
                                                                                if (e.key === 'Escape') setInlineEditing(null);
                                                                            }}
                                                                            className="w-24 h-8"
                                                                            disabled={inlineSaving}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-md min-w-[3rem] transition-colors text-sm"
                                                                            onClick={() => {
                                                                                setInlineEditing({ id: variation.id, field: 'regular_price', isVariation: true, parentId: product.id });
                                                                                setInlineValue(variation.price || "");
                                                                            }}
                                                                            title="Click to edit"
                                                                        >
                                                                            ৳{variation.price}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="hidden md:table-cell">
                                                                    {inlineEditing?.id === variation.id && inlineEditing?.field === 'stock_quantity' && inlineEditing.isVariation ? (
                                                                        <Input
                                                                            autoFocus
                                                                            type="number"
                                                                            value={inlineValue}
                                                                            onChange={(e) => setInlineValue(e.target.value)}
                                                                            onBlur={() => handleInlineSave(variation, 'stock_quantity', true, product.id)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') handleInlineSave(variation, 'stock_quantity', true, product.id);
                                                                                if (e.key === 'Escape') setInlineEditing(null);
                                                                            }}
                                                                            className="w-24 h-8"
                                                                            disabled={inlineSaving}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-md min-w-[3rem] transition-colors text-sm"
                                                                            onClick={() => {
                                                                                setInlineEditing({ id: variation.id, field: 'stock_quantity', isVariation: true, parentId: product.id });
                                                                                setInlineValue(variation.stock_quantity?.toString() || "0");
                                                                            }}
                                                                            title="Click to edit"
                                                                        >
                                                                            {variation.stock_quantity ?? "N/A"}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEditClick(variation, product.id)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        <span className="sr-only">Edit Variation</span>
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )
                                                )}
                                            </Fragment>
                                        ))}
                                        {products.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                    No products found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                {paginationControls}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Make changes to stock and price. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Price ($)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">
                                Stock
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={saving} onClick={handleSaveProduct}>
                            {saving ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
