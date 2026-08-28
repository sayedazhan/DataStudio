# Compare v1.1 Local Test Update

This update keeps the existing Azhan Data Studio single-file analysis workflow and adds:

- prominent `Analyse Single File | Compare Datasets` mode tabs
- Record Movement visual
- Metric Movement visual
- Explain Change arithmetic driver analysis
- always-visible Support UI
- Stripe activation through `NEXT_PUBLIC_SUPPORT_URL`

## Local test

If you are replacing the full project folder, make sure the frontend `.env.local` contains:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

Optional Stripe test/live link:

NEXT_PUBLIC_SUPPORT_URL=https://buy.stripe.com/your-payment-link

Start backend from `backend`:

py -3.13 -m uvicorn app.main:app --reload

Start frontend from `frontend`:

npm run dev

Open:

http://localhost:3000

Use the included sample comparison files and `OrderID` as the key.
