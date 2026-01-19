const { Client } = require("revolt.js");
const http = require("http");

const client = new Client();

client.on("ready", () => {
  console.log("Stoat Bot Online");
});

async function askChatGPT(text) {
  console.log("[DEBUG] askChatGPT input:", text);

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
    const errText = await res.text();
    console.error("[DEBUG] OpenAI HTTP Error:", res.status, errText);
    throw new Error("OpenAI request failed");
  }

  const data = await res.json();
  console.log("[DEBUG] OpenAI raw response:", data);

  return data.choices?.[0]?.message?.content ?? "no response";
}


  const data = await res.json();
  console.log("[DEBUG] OpenAI raw response:", data);

  return data.choices?.[0]?.message?.content ?? "no response";
}

client.on("messageCreate", async (msg) => {
  if (!msg.content) return;
  if (msg.author?.bot) return;

  const text = msg.content.trim();
  const userId = msg.author._id;

  console.log("[DEBUG] message from", userId, ":", text);

  if (text === "!ping") {
    await msg.reply("pong");
    return;
  }

  if (text === "!スタート") {
    await msg.reply("歯車は回り始めた。止まらない。");
    return;
  }

  if (text.startsWith("!mikan chatgpt ")) {
    const prompt = text.replace("!mikan chatgpt ", "").trim();
    if (!prompt) {
      await msg.reply("your text is empty.");
      return;
    }

    try {
      const reply = await askChatGPT(prompt);
      await msg.reply(reply);
    } catch (e) {
      await msg.reply("ChatGPT connecting error");
    }
    return;
  }
});

client.loginBot(process.env.BOT_TOKEN);

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("alive");
}).listen(process.env.PORT || 3000);
