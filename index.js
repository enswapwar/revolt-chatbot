const { Client } = require("revolt.js");
const http = require("http");

const client = new Client();

client.on("ready", () => {
  console.log("Stoat Bot Online");
});

async function askChatGPT(text) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return "OPENAI_API_KEY が見つかりません。EnvironmentでKeyとValueの確認を行ってから再起動してください。";
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
          { role: "system", content: "あなたはStoat.chatで動くbotです。何でも屋としてやってください。また、ときにはおちゃめに振る舞って、自由気ままにしてください" },
          { role: "user", content: text }
        ]
      })
    });

    if (!res.ok) {
      const t = await res.text();
      console.log("OpenAI に エラーが生じました。時間が経てば治る可能性があるのでお待ち下さい:", t);
      return "OpenAI API error";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "no response";

  } catch (err) {
    console.log("ChatGPT が クラッシュしました。時間が経てば治る可能性があるのでお待ち下さい:", err);
    return "ChatGPT internal error";
  }
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
      await msg.reply("メッセージが空です。");
      return;
    }

    const reply = await askChatGPT(prompt);
    await msg.reply(reply);
  }
});

client.loginBot(process.env.BOT_TOKEN);

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("alive");
}).listen(process.env.PORT || 3000);
