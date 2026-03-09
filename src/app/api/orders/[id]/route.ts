import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const routeParams = await params;
        const body = await request.json();
        const response = await api.put(`orders/${routeParams.id}`, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("API Error (Orders PUT):", error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.message || error.message },
            { status: 500 }
        );
    }
}
