import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import https from 'https';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const rawUrl = "https://kidsparadise.com.bd/";
// Clean URL: remove trailing slashes and common path suffixes that might cause double-pathing
// We also ensure it starts with https://
let cleanUrl = rawUrl.trim().replace(/\/wp-json\/?.*$/, '').replace(/\/$/, '');
if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

export const api = new WooCommerceRestApi({
    url: cleanUrl,
    consumerKey: "ck_45d6fe6dd079f9efb7a97c70bb3a4e8e7ce2542b",
    consumerSecret: "cs_472c0fbb8e9945178eae3b15840611e785521a90",
    version: "wc/v3",
    axiosConfig: {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        timeout: 30000 // 30 seconds timeout
    }
});

// Debug interceptor to see exactly what we are requesting
if (!isBuildTime) {
    (api as any).axios.interceptors.request.use((config: any) => {
        const fullUrl = `${config.baseURL || ''}${config.url}`;
        console.log(`🚀 WooCommerce Request: [${config.method?.toUpperCase()}] ${fullUrl}`);
        return config;
    }, (error: any) => {
        console.error("🚀 Request Interceptor Error:", error);
        return Promise.reject(error);
    });

    (api as any).axios.interceptors.response.use((response: any) => {
        console.log(`✅ WooCommerce Response: [${response.status}] ${response.config.url}`);
        return response;
    }, (error: any) => {
        console.error(`❌ WooCommerce Response Error: [${error.response?.status || 'NETWORK_ERROR'}] ${error.config?.url}`);
        if (error.response?.data) {
            console.error("Error Detail:", JSON.stringify(error.response.data));
        }
        return Promise.reject(error);
    });
}

// Debug interceptor to see exactly what we are requesting
if (!isBuildTime) {
    (api as any).axios.interceptors.request.use((config: any) => {
        console.log(`🚀 WooCommerce Request: [${config.method?.toUpperCase()}] ${config.url}`, config.params);
        return config;
    });
}
