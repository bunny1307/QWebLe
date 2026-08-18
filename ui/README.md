# OrderPad Lite Kiosk

## Customer flow

1. Choose a category.
2. Choose food items.
3. Add items to the cart.
4. Review the order.
5. Optionally enter a customer name/table number.
6. Press **PLACE ORDER & GET TOKEN**.
7. Show the generated token and pay at the restaurant counter.

No payment gateway is included in Lite.

## Run

```bash
npm install
npm run dev
```

The Vite development server runs on `http://127.0.0.1:3000` and proxies `/api` requests to Flask on port `5000`.
