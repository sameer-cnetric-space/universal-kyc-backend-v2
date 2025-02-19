const {
  connectClient,
  connectClient2,
  handle_file,
} = require("../config/faceOnLive/client"); // Import the new connection method

class FaceOnLiveAPI {
  static async idRecognition(frontImage, backImage) {
    try {
      const client = await connectClient(); // Ensure client is initialized
      return await client.predict("/id_recognition", {
        front: handle_file(frontImage),
        back: handle_file(backImage),
      });
    } catch (error) {
      console.error("❌ Error in ID Recognition:", error.message);
      return null;
    }
  }

  static async idRecognitionOneSide(frontImage) {
    try {
      const client = await connectClient();
      return await client.predict("/id_recognition_oneside", {
        front: handle_file(frontImage),
      });
    } catch (error) {
      console.error("❌ Error in ID Recognition One Side:", error.message);
      return null;
    }
  }

  static async idLiveness(frontImage) {
    try {
      const client = await connectClient2();
      return await client.predict("/id_liveness", {
        path: handle_file(frontImage),
      });
    } catch (error) {
      console.error("❌ Error in ID Recognition One Side:", error.message);
      return null;
    }
  }

  static async compareFace(image1, image2) {
    try {
      const client = await connectClient();
      return await client.predict("/compare_face", {
        path1: handle_file(image1),
        path2: handle_file(image2),
      });
    } catch (error) {
      console.error("❌ Error in Face Comparison:", error.message);
      return null;
    }
  }

  static async faceLiveness(image) {
    try {
      const client = await connectClient();
      return await client.predict("/face_liveness", {
        path: handle_file(image),
      });
    } catch (error) {
      console.error("❌ Error in Face Liveness:", error.message);
      return null;
    }
  }
}

module.exports = FaceOnLiveAPI;
