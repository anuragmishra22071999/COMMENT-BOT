const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");
const express = require("express");

dotenv.config();
const app = express();

const POST_LINK = process.env.POST_LINK;
const COMMENT_FILE = "comment.txt";
const TOKEN_FILE = "token.txt";
const INTERVAL = 40000; // 40 seconds
const PORT = 3000;

// 🔍 Resolve post ID from pfbid or normal links
async function resolvePostID(link) {
  if (link.includes("/posts/") && link.includes("pfbid")) {
    try {
      const res = await axios.get(link);
      const redirected = res.request.res.responseUrl;
      const match = redirected.match(/\/posts\/(\d+)/);
      if (match) return match[1];
    } catch (err) {
      console.log("❌ Could not resolve post ID from pfbid:", err.message);
    }
  }

  const standard = link.match(/\/posts\/(\d+)/);
  if (standard) return standard[1];

  const story = link.match(/story_fbid=(\d+)&id=(\d+)/);
  if (story) return story[1];

  return null;
}

async function startBot() {
  const token = fs.readFileSync(TOKEN_FILE, "utf-8").trim();
  const comments = fs.readFileSync(COMMENT_FILE, "utf-8").split("\n").filter(Boolean);
  const postId = await resolvePostID(POST_LINK);

  if (!postId) return console.error("❌ Post ID not found!");

  console.log(`🚀 Bot started on Post ID: ${postId}`);
  let i = 0;

  setInterval(async () => {
    const message = comments[i % comments.length];
    try {
      const res = await axios.post(`https://graph.facebook.com/${postId}/comments`, {
        message,
        access_token: token
      });
      console.log(`✅ [${new Date().toLocaleTimeString()}] Commented: "${message}" → ID: ${res.data.id}`);
    } catch (err) {
      console.log("❌ Comment failed:", err.response?.data?.error?.message || err.message);
    }
    i++;
  }, INTERVAL);
}

// Uptime Express route
app.get("/", (req, res) => {
  res.send("🔥 Facebook Comment Bot is running!");
});

app.listen(PORT, () => {
  console.log(`🌐 Uptime server live at http://localhost:${PORT}`);
  startBot();
});
