import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "10";
    const search = searchParams.get("search") || "";

    try {
        let response = await api.get("products", {
            page,
            per_page,
            search,
            orderby: "modified",
            order: "desc",
        });

        // If no products found via standard search, and there is a search term, try searching by exact SKU
        if (search && response.data.length === 0) {
            response = await api.get("products", {
                page,
                per_page,
                sku: search,
                orderby: "modified",
                order: "desc",
            });
        }

        return NextResponse.json({
            products: response.data,
            total: response.headers["x-wp-total"],
            totalPages: response.headers["x-wp-totalpages"],
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await api.post("products", body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || error.message },
            { status: 500 }
        );
    }
}
