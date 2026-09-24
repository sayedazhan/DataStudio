# Azhan Data Studio v3.5.1 — Stripe Link Fix

## Fix
The Pay Calculator Stripe Payment Link was incorrectly reused as the global Azhan Data Studio support checkout in v3.5. It has been removed from the Data Studio source.

Data Studio now uses its own optional environment variable only:

`NEXT_PUBLIC_DATA_STUDIO_SUPPORT_URL`

If the variable is blank, Data Studio will not send users to another product's checkout. Support buttons either remain inactive/hidden or show a not-configured state depending on context.

## Configure the correct Data Studio Stripe link
Set the following in `frontend/.env.local` for local testing or in the Netlify environment variables for production:

`NEXT_PUBLIC_DATA_STUDIO_SUPPORT_URL=https://buy.stripe.com/<your-data-studio-payment-link>`

Restart/redeploy the frontend after changing the value.
