const { Client } = require("revolt.js");
const http = require("http");

const client = new Client();
const chatgptUsers = new Map();

// ChatGPT 呼び出し（Node.js v22 の標準 fetch 使用）
async function askChatGPT(text) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are ChatGPT injected into a Stoat bot." },
        { role: "user", content: text }
      ]
    })
  });

  const data = await res.json();

  console.log("OpenAI status:", res.status);
  console.log("OpenAI response:", JSON.stringify(data, null, 2));

  if (!data.choices || !data.choices[0]) {
    throw new Error("No choices in OpenAI response");
  }

  return data.choices[0].message.content;
}

client.on("ready", () => {
  console.log("Stoat Bot Online");
});

client.on("messageCreate", async (msg) => {
  if (!msg.content) return;
  if (msg.author?.bot) return;

  const userId = msg.author._id;
  const text = msg.content.trim();

  // ping pong
  if (text === "!ping") {
    await msg.reply("pong");
    return;
  }

  if (text === "!mikan chatgpt start") {
    chatgptUsers.set(userId, true);
    await msg.reply("ChatGPT 接続開始");
    return;
  }

  if (text === "!mikan chatgpt stop") {
    chatgptUsers.delete(userId);
    await msg.reply("ChatGPT 接続終了");
    return;
  }

  if (!chatgptUsers.has(userId)) return;

  try {
    const reply = await askChatGPT(text);
    await msg.reply(reply);
  } catch (e) {
    console.error("ChatGPT error:", e);
    await msg.reply("ChatGPT エラー（ログ確認）");
  }
});

client.loginBot(process.env.BOT_TOKEN);

// ダミーHTTP
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("alive");
}).listen(process.env.PORT || 3000);
