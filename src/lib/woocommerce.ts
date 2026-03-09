import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import https from 'https';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// The actual store URL
const rawUrl = "https://kidsparadise.com.bd/";

// Extremely robust URL cleaning
let cleanUrl = rawUrl.trim();
if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
cleanUrl = cleanUrl.replace(/\/wp-json\/wc\/v3\/?$/, '').replace(/\/wp-json\/?$/, '').replace(/\/$/, '');

export const api = new WooCommerceRestApi({
    url: cleanUrl,
    consumerKey: "ck_45d6fe6dd079f9efb7a97c70bb3a4e8e7ce2542b",
    consumerSecret: "cs_472c0fbb8e9945178eae3b15840611e785521a90",
    version: "wc/v3",
    queryStringAuth: true, // often necessary for servers that block 'Authorization' headers
    axiosConfig: {
        timeout: 30000,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        headers: {
            // Some servers block default axios user-agents
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
    }
});

// Debug interceptors
if (!isBuildTime) {
    (api as any).axios.interceptors.request.use((config: any) => {
        const fullUrl = `${config.baseURL || ''}${config.url}`;
        console.log(`🚀 WooCommerce Request: [${config.method?.toUpperCase()}] ${fullUrl}`);
        return config;
    });

    (api as any).axios.interceptors.response.use((response: any) => {
        console.log(`✅ WooCommerce Response: [${response.status}] ${response.statusText}`);
        return response;
    }, (error: any) => {
        let errorMsg = error.message;

        // Handle cases where the server returns HTML instead of JSON
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
            const titleMatch = error.response.data.match(/<title>(.*?)<\/title>/);
            const bodyMatch = error.response.data.match(/<body[^>]*>([\s\S]*?)<\/body>/);
            const pageTitle = titleMatch ? titleMatch[1] : "HTML Error Page";

            console.error(`❌ HTML received from server: "${pageTitle}"`);

            // Extract a clean error message if possible
            errorMsg = `Server returned HTML: "${pageTitle}". This usually means your store is blocking the API request (check firewall/WAF).`;

            // Attach the nicer message so API routes can use it
            error.message = errorMsg;
        }

        console.error(`❌ WooCommerce Response Error: [${error.response?.status || 'NETWORK_ERROR'}] ${error.config?.url}`);
        return Promise.reject(error);
    });
}
