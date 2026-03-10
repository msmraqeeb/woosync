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
