# OrderPad Lite Server

This version is the **OrderPad Lite** restaurant self-ordering system.

## Lite flow

Customer kiosk:

`Menu → Cart → Review Order → Place Order → Token`

There is **no online payment processing** in this version. The customer pays at the restaurant counter after receiving the token.

Admin:

`Admin → Orders → Send to Kitchen (optional)`

Kitchen:

`Kitchen QSR → Preparing → Ready → Completed`

## Run

1. Create/update the MySQL database with `schema.sql`.
2. Copy `.env.example` to `.env` and fill in your MySQL/admin settings.
3. Generate an admin password hash with:

   `python create_admin_hash.py`

4. Install dependencies:

   `pip install -r requirements.txt`

5. Start the server:

   `python server.py`

6. Open the kiosk through the Vite development server on port `3000`, with `/api` proxied to Flask on port `5000`.
7. Open Admin at `http://127.0.0.1:5000/admin`.
8. Open the Kitchen QSR screen from Admin or directly at `/kitchen` after signing in.

## Important

- MySQL remains the source of truth for menu and orders.
- The server creates the daily token.
- No Razorpay, UPI QR, card payment, payment webhook, or payment confirmation endpoint is used by OrderPad Lite.
- The existing `orders` table is migrated automatically at runtime if `kitchen_status` or `sent_to_kitchen` is missing.
- The Lite database schema keeps two legacy payment-status columns for compatibility with an already-created database, but they are set to `COUNTER` / `NOT_APPLICABLE` and are not used for payment processing.
