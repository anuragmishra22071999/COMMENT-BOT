const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");
const express = require("express");

dotenv.config();

const app = express();
const PORT = 3000;
const INTERVAL = 40000; // 40 sec
const COMMENT_FILE = "comment.txt";
const TOKEN_FILE = "token.txt";
const POST_LINK = process.env.POST_LINK;

// 🔍 Extract post ID from any Facebook link (normal / pfbid / story)
async function getPostId(link) {
  // 1. If normal /posts/{post_id} format
  const normal = link.match(/\/posts\/(\d+)/);
  if (normal) return normal[1];

  // 2. If story_fbid
  const story = link.match(/story_fbid=(\d+)&id=(\d+)/);
  if (story) return story[1];

  // 3. Try to resolve redirect (pfbid type)
  try {
    const res = await axios.get(link, { maxRedirects: 0, validateStatus: null });
    const redirectUrl = res.headers.location;
    if (redirectUrl) {
      const redirected = redirectUrl.match(/\/posts\/(\d+)/);
      if (redirected) return redirected[1];
    }
  } catch (err) {
    console.log("❌ Failed to follow pfbid redirect:", err.message);
  }

  return null;
}

async function startBot() {
  const token = fs.readFileSync(TOKEN_FILE, "utf-8").trim();
  const comments = fs.readFileSync(COMMENT_FILE, "utf-8").split("\n").filter(Boolean);
  const postId = await getPostId(POST_LINK);

  if (!postId) return console.log("❌ Post ID not found!");

  console.log(`🚀 Bot started | Post ID: ${postId}`);
  let i = 0;

  setInterval(async () => {
    const message = comments[i % comments.length];
    try {
      const res = await axios.post(`https://graph.facebook.com/${postId}/comments`, {
        message,
        access_token: token
      });
      console.log(`✅ Commented: "${message}" | ID: ${res.data.id}`);
    } catch (err) {
      console.log("❌ Error:", err.response?.data?.error?.message || err.message);
    }
    i++;
  }, INTERVAL);
}

// Uptime route
app.get("/", (req, res) => {
  res.send("🔥 Facebook Auto Comment Bot is Running!");
});

app.listen(PORT, () => {
  console.log(`🌐 Uptime server live at http://localhost:${PORT}`);
  startBot();
});
