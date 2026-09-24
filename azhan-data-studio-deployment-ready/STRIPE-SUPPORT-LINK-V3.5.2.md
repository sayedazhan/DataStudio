# Azhan Data Studio v3.5.2 - Support Link

## Change
The confirmed Azhan Data Studio Stripe support/payment link is now configured centrally:

`https://buy.stripe.com/3cIcN514E65u8MnaKAdjO00`

The app uses `NEXT_PUBLIC_DATA_STUDIO_SUPPORT_URL` when supplied and falls back to this confirmed Data Studio link. All Support buttons resolve through `frontend/app/lib/config.ts`.

The Pay Calculator Stripe link is not present in this project.
