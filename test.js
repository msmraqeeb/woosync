const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
    url: "https://kidsparadise.com.bd/",
    consumerKey: "ck_45d6fe6dd079f9efb7a97c70bb3a4e8e7ce2542b",
    consumerSecret: "cs_472c0fbb8e9945178eae3b15840611e785521a90",
    version: "wc/v3",
    queryStringAuth: true,
    axiosConfig: {
        timeout: 30000,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    }
});

api.get("products", { per_page: 1 })
    .then(res => {
        console.log("SUCCESS:", res.status);
    })
    .catch(err => {
        console.log("ERROR MESSAGE:", err.message);
        if (err.response) {
            console.log("RESPONSE DATA TYPE:", typeof err.response.data);
            console.log("RESPONSE DATA SNIPPET:", String(err.response.data).substring(0, 100));
        }
    });
