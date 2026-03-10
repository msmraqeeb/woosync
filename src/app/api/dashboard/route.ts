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
        console.error("❌ Raw API Error encountered:", error?.message);

        let safeErrorMsg = "Unknown internal server error";
        let safeStatus = 500;

        try {
            if (error?.response?.status && error.response.status >= 200 && error.response.status <= 599) {
                safeStatus = error.response.status;
            }

            if (error?.message) {
                safeErrorMsg = String(error.message);
            }
            if (error?.response?.data) {
                if (typeof error.response.data === 'string') {
                    safeErrorMsg = error.response.data.substring(0, 150);
                } else if (error.response.data.message) {
                    safeErrorMsg = String(error.response.data.message);
                } else {
                    safeErrorMsg = JSON.stringify(error.response.data).substring(0, 150);
                }
            }
        } catch (e) {
            console.error("Failed to parse error details", e);
        }

        return NextResponse.json(
            { error: safeErrorMsg },
            { status: safeStatus }
        );
    }
}
