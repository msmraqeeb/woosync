import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "10";
    const search = searchParams.get("search") || "";

    try {
        const response = await api.get("customers", {
            page,
            per_page,
            search,
        });
        return NextResponse.json({
            customers: response.data,
            total: response.headers["x-wp-total"],
            totalPages: response.headers["x-wp-totalpages"],
        });
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.response?.data || error.message;
        console.error("❌ API Error (Customers):", errorMsg);
        return NextResponse.json(
            { error: errorMsg },
            { status: error.response?.status || 500 }
        );
    }
}
