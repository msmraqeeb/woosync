import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import https from 'https';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const rawUrl = "https://kidsparadise.com.bd/";
// Clean URL: remove trailing slashes and common path suffixes that might cause double-pathing
const cleanUrl = rawUrl.replace(/\/wp-json\/wc\/v3\/?$/, '').replace(/\/wp-json\/?$/, '').replace(/\/$/, '');

export const api = new WooCommerceRestApi({
    url: cleanUrl,
    consumerKey: "ck_45d6fe6dd079f9efb7a97c70bb3a4e8e7ce2542b",
    consumerSecret: "cs_472c0fbb8e9945178eae3b15840611e785521a90",
    version: "wc/v3",
    queryStringAuth: true,
    axiosConfig: {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }
});

// Debug interceptor to see exactly what we are requesting
if (!isBuildTime) {
    (api as any).axios.interceptors.request.use((config: any) => {
        console.log(`🚀 WooCommerce Request: [${config.method?.toUpperCase()}] ${config.url}`, config.params);
        return config;
    });
}
