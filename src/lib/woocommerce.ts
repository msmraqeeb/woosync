import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const api = new WooCommerceRestApi({
    url: process.env.WOOCOMMERCE_URL || "https://example.com",
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || "ck_dummy",
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || "cs_dummy",
    version: "wc/v3",
    queryStringAuth: true,
});
