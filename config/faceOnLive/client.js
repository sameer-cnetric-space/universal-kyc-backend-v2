const { handle_file, Client } = require("./index.min.js");

const SERVER_URL = process.env.FACE_SERVER_URL;
const SERVER_URL_2 = process.env.FACE_SERVER_URL_2;
const ACCESS_TOKEN = process.env.FACE_ACCESS_TOKEN;

if (!SERVER_URL || !ACCESS_TOKEN) {
  throw new Error(
    "Missing required environment variables: SERVER_URL or ACCESS_TOKEN"
  );
}

let client; // Singleton instance
let client2; // Singleton instance for ID Live

const connectClient = async () => {
  if (!client) {
    try {
      //console.log("🔄 Connecting to FaceOnLive...");
      client = await Client.connect(SERVER_URL, {
        hf_token: ACCESS_TOKEN,
      });
      //console.log("✅ FaceOnLive Connection Successful!");
    } catch (error) {
      console.error("❌ Error connecting to FaceOnLive:", error.message);
      process.exit(1); // Exit process if connection fails
    }
  }
  return client;
};

const connectClient2 = async () => {
  if (!client2) {
    try {
      //console.log("🔄 Connecting to FaceOnLive...");
      client2 = await Client.connect(SERVER_URL_2, {
        hf_token: ACCESS_TOKEN,
      });
      //console.log("✅ FaceOnLive Connection Successful!");
    } catch (error) {
      console.error("❌ Error connecting to FaceOnLive:", error.message);
      process.exit(1); // Exit process if connection fails
    }
  }
  return client2;
};

// Initialize client and export a function to get it
module.exports = {
  connectClient,
  connectClient2,
  handle_file,
};
