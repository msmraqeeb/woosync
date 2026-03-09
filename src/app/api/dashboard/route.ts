import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch summary stats concurrently
        const [ordersRes, productsRes, customersRes] = await Promise.all([
            api.get("orders", { per_page: 1, status: "processing,completed" }),
            api.get("products", { per_page: 1 }),
            api.get("customers", { per_page: 1 }),
        ]);

        // We can get totals from the x-wp-total header
        const totalOrders = ordersRes.headers["x-wp-total"] || "0";
        const totalProducts = productsRes.headers["x-wp-total"] || "0";
        const totalCustomers = customersRes.headers["x-wp-total"] || "0";

        // For total sales, we can fetch reports using WooCommerce Reports API
        const salesRes = await api.get("reports/sales", { period: "month" });
        const totalSales = salesRes.data[0]?.total_sales || "0";

        // Get 5 most recent orders for recent activity
        const recentOrdersRes = await api.get("orders", { per_page: 5 });
        const recentOrders = recentOrdersRes.data;

        return NextResponse.json({
            totalOrders,
            totalProducts,
            totalCustomers,
            totalSales,
            recentOrders,
        });
    } catch (error: any) {
        console.error("API Error (Dashboard):", error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.message || error.message },
            { status: 500 }
        );
    }
}
