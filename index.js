const { Client } = require("revolt.js");
const http = require("http");

const client = new Client();

client.on("ready", () => {
  console.log("Stoat Bot Online");
});

client.on("message", async (msg) => {
  if (msg.author.bot) return;
  if (msg.content === "!ping") {
    await msg.reply("pong");
  }
});

client.loginBot(process.env.BOT_TOKEN);

// Render用ダミーHTTP
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("alive");
}).listen(process.env.PORT || 3000);
