const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");
const express = require("express");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const commentFile = "comment.txt";
const tokenFile = "token.txt";
const interval = parseInt(process.env.INTERVAL) || 5000;
const postLink = process.env.POST_LINK;

// ✅ Function to extract Post ID from post link
function extractPostID(link) {
  const match = link.match(/\/posts\/(\d+)/);
  if (match) return match[1];
  const story = link.match(/story_fbid=(\d+)&id=(\d+)/);
  if (story) return story[1];
  return null;
}

async function startBot() {
  const token = fs.readFileSync(tokenFile, "utf-8").trim();
  const comments = fs.readFileSync(commentFile, "utf-8").split("\n").filter(Boolean);
  const postId = extractPostID(postLink);

  if (!postId) {
    console.log("❌ Post ID extract nahi hua. Link sahi daalo.");
    return;
  }

  console.log(`🚀 Bot shuru ho gaya: Post ID => ${postId}`);
  let i = 0;

  setInterval(async () => {
    const message = comments[i % comments.length];
    try {
      const res = await axios.post(`https://graph.facebook.com/${postId}/comments`, {
        message,
        access_token: token
      });
      console.log(`✅ Comment bheja: "${message}" | ID: ${res.data.id}`);
    } catch (err) {
      console.log("❌ Error:", err.response?.data?.error?.message || err.message);
    }
    i++;
  }, interval);
}

// Express uptime route
app.get("/", (req, res) => {
  res.send("🔥 Facebook Comment Bot is Live!");
});

// Start server and bot
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
  startBot();
});
