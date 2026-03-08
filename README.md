# WooSync Inventory Setup Instructions

Welcome to your WooSync Inventory application! This app is ready to connect bi-directionally with your WooCommerce store.

## 1. Environment Connections
To connect the app to your store, open `.env.local` and add your exact WooCommerce credentials:

```
WOOCOMMERCE_URL=https://your-store-url.com
WOOCOMMERCE_CONSUMER_KEY=ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WOOCOMMERCE_CONSUMER_SECRET=cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

You can generate these keys in your WordPress Admin Panel -> WooCommerce -> Settings -> Advanced -> REST API -> Add Key.

## 2. Webhook Setup
To ensure the app reflects changes instantly when an order or product is updated on the website, you must set up Webhooks in WooCommerce.

1. Go to **WooCommerce > Settings > Advanced > Webhooks**.
2. Click **Add webhook**.
3. Create webhooks for the following topics:
   - `Product updated`
   - `Order created`
   - `Order updated`
   - `Customer created`
4. Set the **Delivery URL** to your hosted app's webhook route: 
   `https://[your-app-domain]/api/webhooks/woocommerce`
5. Status should be **Active**.

## 3. Running the App
To start the app locally:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view your dashboard!
