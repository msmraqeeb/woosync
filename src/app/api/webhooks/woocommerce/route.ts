import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-wc-webhook-signature");
        const event = request.headers.get("x-wc-webhook-event");
        const topic = request.headers.get("x-wc-webhook-topic"); // e.g., product.updated, order.created

        // In a production app, verify the signature using crypto.createHmac
        // with your webhook secret.

        console.log(`Received WooCommerce Webhook: ${topic}`);

        const body = JSON.parse(rawBody);

        // Revalidate Next.js cache paths
        if (topic?.startsWith("product")) {
            revalidatePath("/products");
        } else if (topic?.startsWith("order")) {
            revalidatePath("/orders");
        } else if (topic?.startsWith("customer")) {
            revalidatePath("/customers");
        }

        revalidatePath("/");

        return NextResponse.json({ received: true, topic });
    } catch (error: any) {
        console.error("Webhook Error", error);
        return NextResponse.json(
            { error: "Webhook Error" },
            { status: 500 }
        );
    }
}
