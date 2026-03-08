import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; variationId: string }> }
) {
    try {
        const routeParams = await params;
        const body = await request.json();
        const response = await api.put(`products/${routeParams.id}/variations/${routeParams.variationId}`, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || error.message },
            { status: 500 }
        );
    }
}
