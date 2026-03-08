import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const routeParams = await params;
        const body = await request.json();
        const response = await api.put(`products/${routeParams.id}`, body);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const routeParams = await params;
        const response = await api.delete(`products/${routeParams.id}`, { force: true });
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || error.message },
            { status: 500 }
        );
    }
}
