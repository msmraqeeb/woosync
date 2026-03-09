import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import https from 'https';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// The actual store URL
const rawUrl = "https://kidsparadise.com.bd/";

// Extremely robust URL cleaning
let cleanUrl = rawUrl.trim();
if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
cleanUrl = cleanUrl.replace(/\/wp-json\/?.*$/, '').replace(/\/$/, '');

export const api = new WooCommerceRestApi({
    url: cleanUrl,
    consumerKey: "ck_45d6fe6dd079f9efb7a97c70bb3a4e8e7ce2542b",
    consumerSecret: "cs_472c0fbb8e9945178eae3b15840611e785521a90",
    version: "wc/v3",
    queryStringAuth: true, // Crucial for many shared hosting environments
    axiosConfig: {
        timeout: 30000,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }
});

// Debug interceptors
if (!isBuildTime) {
    (api as any).axios.interceptors.request.use((config: any) => {
        const fullUrl = `${config.baseURL || ''}${config.url}`;
        console.log(`🚀 Requesting: [${config.method?.toUpperCase()}] ${fullUrl}`);
        return config;
    });

    (api as any).axios.interceptors.response.use((response: any) => {
        console.log(`✅ Response: [${response.status}] ${response.statusText}`);
        return response;
    }, (error: any) => {
        let errorMsg = error.message;

        // Detailed HTML Error Extraction
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
            const titleMatch = error.response.data.match(/<title>(.*?)<\/title>/);
            const pageTitle = titleMatch ? titleMatch[1] : "HTML Error Page";
            // Attach the nicer message so API routes can use it
            error.message = errorMsg;
        }

        console.error(`❌ WooCommerce Response Error: [${error.response?.status || 'NETWORK_ERROR'}] ${error.config?.url}`);
        return Promise.reject(error);
    });
}
