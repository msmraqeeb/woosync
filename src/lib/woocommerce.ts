import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import https from 'https';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

if (!isBuildTime && (!process.env.WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL === "https://example.com")) {
    console.warn("⚠️ WOOCOMMERCE_URL is missing or using default. Data may not load.");
}

export const api = new WooCommerceRestApi({
    url: process.env.WOOCOMMERCE_URL || "https://example.com",
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || "ck_dummy",
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || "cs_dummy",
    version: "wc/v3",
    queryStringAuth: true,
    axiosConfig: {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }
});
