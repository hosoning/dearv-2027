import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number };
  from?: { id: number; first_name?: string; username?: string };
};

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const allowedChatId = Deno.env.get("TELEGRAM_ALLOWED_CHAT_ID") ?? "";
const telegramWebhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const progressSecret = Deno.env.get("DEARV_PROGRESS_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

async function sendMessage(chatId: number | string, text: string) {
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is missing");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!response.ok) throw new Error(`Telegram send failed: ${response.status}`);
}

async function latestStatus(): Promise<string> {
  const { data } = await db
    .from("project_progress")
    .select("phase,summary,status,commit_sha,details_url,created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return "DearV 正在製作中，目前還沒有新的雲端 build 記錄。";
  const icon = data.status === "success" ? "✅" : data.status === "failure" ? "❌" : "🛠️";
  const sha = data.commit_sha ? `\n版本：${String(data.commit_sha).slice(0, 8)}` : "";
  const link = data.details_url ? `\n詳情：${data.details_url}` : "";
  return `${icon} ${data.phase}\n${data.summary}${sha}${link}`;
}

async function handleTelegram(message: TelegramMessage) {
  const chatId = String(message.chat.id);
  if (!allowedChatId || chatId !== allowedChatId) {
    await sendMessage(message.chat.id, "這是 DearV 私人進度機器人，這個帳號沒有存取權限。");
    return;
  }
  const text = (message.text ?? "").trim();
  if (!text) return;
  if (text === "/start") {
    await sendMessage(message.chat.id, "DearV 已連線。\n\n/status 查看最新進度\n直接輸入文字即可提交修改意見。你的內容只會進入私人專案待辦。");
    return;
  }
  if (text === "/status") {
    await sendMessage(message.chat.id, await latestStatus());
    return;
  }
  const { error } = await db.from("telegram_feedback").upsert({
    telegram_chat_id: message.chat.id,
    telegram_user_id: message.from?.id ?? null,
    telegram_message_id: message.message_id,
    message: text,
    context: {
      first_name: message.from?.first_name ?? null,
      username: message.from?.username ?? null,
    },
  }, { onConflict: "telegram_chat_id,telegram_message_id", ignoreDuplicates: true });
  if (error) throw error;
  await sendMessage(message.chat.id, "收到，已放進 DearV 私人製作待辦。我會保留原文，之後處理時回報對應版本。");
}

async function handleProgress(payload: Record<string, unknown>) {
  const rawStatus = String(payload.status ?? "running");
  const normalizedStatus = rawStatus === "success"
    ? "success"
    : rawStatus === "cancelled"
    ? "cancelled"
    : rawStatus === "failure" || rawStatus === "timed_out" || rawStatus === "action_required"
    ? "failure"
    : "running";
  const row = {
    phase: String(payload.phase ?? "Cloud build"),
    summary: String(payload.summary ?? "DearV has a new progress update."),
    status: normalizedStatus,
    commit_sha: payload.commit_sha ? String(payload.commit_sha) : null,
    details_url: payload.details_url ? String(payload.details_url) : null,
    metadata: payload.metadata ?? {},
  };
  const { error } = await db.from("project_progress").insert(row);
  if (error) throw error;
  if (allowedChatId) await sendMessage(allowedChatId, await latestStatus());
}

Deno.serve(async (request) => {
  if (request.method === "GET") return json({ ok: true, service: "dearv-telegram-bridge" });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const telegramSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
    const ciSecret = request.headers.get("x-dearv-progress-secret") ?? "";
    const body = await request.json();
    if (telegramWebhookSecret && telegramSecret === telegramWebhookSecret) {
      if (body?.message) await handleTelegram(body.message as TelegramMessage);
      return json({ ok: true });
    }
    if (progressSecret && ciSecret === progressSecret) {
      await handleProgress(body as Record<string, unknown>);
      return json({ ok: true });
    }
    return json({ error: "unauthorized" }, 401);
  } catch (error) {
    console.error(error);
    return json({ error: "bridge_failed" }, 500);
  }
});
