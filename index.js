const { Client } = require("revolt.js");
const http = require("http");
const fetch = require("node-fetch");

const client = new Client();

client.on("ready", () => {
  console.log("Stoat Bot Online");
});

async function askChatGPT(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are ChatGPT injected into a Stoat bot." },
        { role: "user", content: text }
      ]
    })
  });

  if (!res.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "no response";
}

function rollDice(input) {
  let count = 1;
  let sides = 6;

  if (input) {
    if (/^\d+d\d+$/.test(input)) {
      const [c, s] = input.split("d").map(Number);
      count = c;
      sides = s;
    } else if (/^\d+$/.test(input)) {
      sides = Number(input);
    } else {
      return null;
    }
  }

  if (count <= 0 || sides <= 0 || count > 100 || sides > 1000) {
    return null;
  }

  const rolls = [];
  let total = 0;

  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    total += r;
  }

  return { count, sides, rolls, total };
}

client.on("messageCreate", async (msg) => {
  if (!msg.content) return;
  if (msg.author?.bot) return;

  const text = msg.content.trim();

  if (text === "!ping") {
    await msg.reply("pong");
    return;
  }

  if (text === "!スタート") {
    await msg.reply("歯車は回り始めた。止まらない。");
    return;
  }

  // ダイスロール
  if (text.startsWith("!dice") || text.startsWith("!roll")) {
    const arg = text.split(" ")[1];
    const result = rollDice(arg);

    if (!result) {
      await msg.reply("dice format error");
      return;
    }

    await msg.reply(
      `🎲 ${result.count}d${result.sides}\n[${result.rolls.join(", ")}]\nTotal: ${result.total}`
    );
    return;
  }

  if (text.startsWith("!chatgpt ")) {
    const prompt = text.slice("!chatgpt ".length).trim();
    if (!prompt) {
      await msg.reply("メッセージが空です。!chatgptのあとに質問内容を入力してください。");
      return;
    }

    try {
      const reply = await askChatGPT(prompt);
      await msg.reply(reply);
    } catch {
      await msg.reply("ChatGPTに接続できませんでした。もう一度試してください");
    }
  }
});

client.loginBot(process.env.BOT_TOKEN);

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("alive");
}).listen(process.env.PORT || 3000);
