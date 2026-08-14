# DearV Telegram bridge

The bridge is a private, low-maintenance remote status and feedback surface.
It does not place an API key in the app or repository.

## What it does

- sends Godot validation and Pages deployment results to the owner;
- accepts `/status` and returns the newest cloud milestone;
- stores free-form owner feedback in `telegram_feedback`;
- rejects every Telegram chat except `TELEGRAM_ALLOWED_CHAT_ID`.

## One-time private setup

1. Create a private bot with Telegram `@BotFather` and keep the token secret.
2. Apply `supabase/telegram_bridge_schema.sql`.
3. Deploy `supabase/functions/telegram-bridge` with JWT verification disabled;
   security is enforced by Telegram's webhook secret and the chat allow-list.
4. Add these Supabase function secrets:
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_CHAT_ID`,
   `TELEGRAM_WEBHOOK_SECRET`, and `DEARV_PROGRESS_SECRET`.
5. Register the Telegram webhook with `secret_token` set to the same
   `TELEGRAM_WEBHOOK_SECRET`.
6. Add GitHub repository secrets `SUPABASE_TELEGRAM_BRIDGE_URL` and
   `DEARV_PROGRESS_SECRET`.

The bot is only a progress/feedback bridge. Conversational AI inside Telegram
would additionally require a separately billed OpenAI API key or a supported
cloud-agent connection; a ChatGPT subscription is not an API credential.
