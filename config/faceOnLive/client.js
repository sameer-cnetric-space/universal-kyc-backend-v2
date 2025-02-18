const { handle_file, Client } = require("./index.min.js");

const SERVER_URL = process.env.FACE_SERVER_URL;
const ACCESS_TOKEN = process.env.FACE_ACCESS_TOKEN;

if (!SERVER_URL || !ACCESS_TOKEN) {
  throw new Error(
    "Missing required environment variables: SERVER_URL or ACCESS_TOKEN"
  );
}

let client; // Singleton instance

const connectClient = async () => {
  if (!client) {
    try {
      console.log("🔄 Connecting to FaceOnLive...");
      client = await Client.connect(SERVER_URL, {
        hf_token: ACCESS_TOKEN,
      });
      console.log("✅ FaceOnLive Connection Successful!");
    } catch (error) {
      console.error("❌ Error connecting to FaceOnLive:", error.message);
      process.exit(1); // Exit process if connection fails
    }
  }
  return client;
};

// Initialize client and export a function to get it
module.exports = {
  connectClient,
  handle_file,
};
