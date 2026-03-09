import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "10";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    try {
        const params: any = { page, per_page, search };
        if (status) params.status = status;

        const response = await api.get("orders", params);
        return NextResponse.json({
            orders: response.data,
            total: response.headers["x-wp-total"],
            totalPages: response.headers["x-wp-totalpages"],
        });
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.response?.data || error.message;
        console.error("❌ API Error (Orders):", errorMsg);
        return NextResponse.json(
            { error: errorMsg },
            { status: error.response?.status || 500 }
        );
    }
}
