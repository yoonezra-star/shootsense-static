const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const payload = process.argv[2];

if (!token || !chatId) {
  console.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set.");
  process.exit(1);
}

let message = "Shootsense deployment completed.";
if (payload) {
  try {
    const parsed = JSON.parse(payload);
    message = [
      "Shootsense 발행 완료",
      `제목: ${parsed.title || "-"}`,
      `슬러그: ${parsed.slug || "-"}`,
      `카테고리: ${parsed.category || "-"}`,
      `URL: https://shootsense.com/${parsed.slug || ""}/`
    ].join("\n");
  } catch {
    message = payload;
  }
}

const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text: message,
    disable_web_page_preview: false
  })
});

if (!response.ok) {
  const text = await response.text();
  console.error(text);
  process.exit(1);
}

console.log(await response.text());
