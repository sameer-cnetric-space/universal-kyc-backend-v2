const Moderation = require("../models/moderation");
const ocrService = require("./ocr");
const faceRecogService = require("./faceRecog");

// const runModerationChecks = async (
//   kycId,
//   documentPath,
//   selfiePath,
//   kycData
// ) => {
//   try {
//     let moderation = new Moderation({
//       kycId,
//       status: "Pending",
//       errorLogs: [],
//     });

//     try {
//       // Step 1: OCR Service
//       try {
//         let ocrData;
//         try {
//           ocrData = await ocrService.extractDataFromDocument(documentPath);
//           moderation.ocrData = ocrData;
//         } catch (error) {
//           moderation.errorLogs.push(`OCR Extraction Error: ${error.message}`);
//           throw error; // Skip further OCR processing if extraction fails
//         }

//         // Remove unnecessary fields from OCR data
//         try {
//           if (ocrData?.hasOwnProperty("sex")) delete ocrData["sex"];
//           if (ocrData?.hasOwnProperty("gender")) delete ocrData["gender"];
//         } catch (error) {
//           moderation.errorLogs.push(
//             `Error cleaning OCR data: ${error.message}`
//           );
//         }

//         // Compare OCR data with KYC form data
//         try {
//           const { isMatch, mismatchResults } = ocrService.compareDocumentByType(
//             kycData.idType,
//             ocrData,
//             kycData
//           );
//           moderation.ocrMatch = isMatch;
//           moderation.ocrMismatchDetails = mismatchResults;
//         } catch (error) {
//           moderation.errorLogs.push(
//             `Error comparing OCR data with KYC data: ${error.message}`
//           );
//         }
//       } catch (error) {
//         moderation.errorLogs.push(`OCR Service Error: ${error.message}`);
//       }

//       // Step 2: Face Recognition and Liveliness Check
//       try {
//         let faceRecogResult;
//         try {
//           faceRecogResult = await faceRecogService.compareFacesAndLiveliness(
//             selfiePath,
//             documentPath
//           );
//         } catch (error) {
//           moderation.errorLogs.push(
//             `Face Recognition Service Error: ${error.message}`
//           );
//           throw error; // Skip liveliness checks if face recognition fails
//         }

//         // Parse and store face recognition and liveliness results
//         try {
//           moderation.faceMatch = {
//             match: faceRecogResult?.match || false,
//             matchConfidence: faceRecogResult?.match_confidence || 0,
//           };

//           moderation.liveliness = {
//             passed: faceRecogResult?.liveliness || false,
//             livelinessDetails: faceRecogResult?.liveliness_details || "",
//             livelinessResults: {
//               sharpness: faceRecogResult?.liveliness_results?.checks
//                 ?.sharpness || {
//                 passed: false,
//                 score: 0,
//               },
//               symmetry: faceRecogResult?.liveliness_results?.checks
//                 ?.symmetry || {
//                 passed: false,
//                 score: 0,
//               },
//               texture: faceRecogResult?.liveliness_results?.checks?.texture || {
//                 passed: false,
//                 score: 0,
//               },
//               moire: faceRecogResult?.liveliness_results?.checks?.moire || {
//                 passed: false,
//                 score: 0,
//               },
//               depth: faceRecogResult?.liveliness_results?.checks?.depth || {
//                 passed: false,
//                 score: 0,
//               },
//               edgeNoise: faceRecogResult?.liveliness_results?.checks
//                 ?.edge_noise || {
//                 passed: false,
//                 score: 0,
//               },
//               blink: faceRecogResult?.liveliness_results?.checks?.blink || {
//                 passed: false,
//                 score: 0,
//               },
//               size: faceRecogResult?.liveliness_results?.checks?.size || {
//                 passed: false,
//                 score: 0,
//               },
//             },
//           };
//         } catch (error) {
//           moderation.errorLogs.push(
//             `Error processing face recognition results: ${error.message}`
//           );
//         }
//       } catch (error) {
//         moderation.errorLogs.push(`Face Recognition Error: ${error.message}`);
//       }

//       // Finalize status
//       moderation.status =
//         moderation.errorLogs.length > 0 ? "Failed" : "Completed";
//     } catch (error) {
//       moderation.errorLogs.push(`Unexpected Error: ${error.message}`);
//       moderation.status = "Failed";
//     } finally {
//       // Save the moderation result to the database
//       try {
//         await moderation.save();
//       } catch (saveError) {
//         console.error(
//           `Error saving moderation result for KYC ID ${kycId}:`,
//           saveError.message
//         );
//       }
//     }

//     return moderation;
//   } catch (error) {
//     console.error("Error in moderation service:", error.message);
//     throw new Error("Moderation checks failed");
//   }
// };

const FaceOnLiveAPI = require("../services/faceOnLive"); // Import FaceOnLive API Service

const runModerationChecks = async (
  kycId,
  frontDocumentPath,
  backDocumentPath,
  selfiePath,
  kycData
) => {
  try {
    console.log(`Starting moderation checks for KYC ID: ${kycId}`);

    let errorLogs = [];

    // Create initial Moderation entry (Pending)
    let moderationEntry = await Moderation.create({
      kycId,
      status: "Pending",
    });

    let idRecogData = {};
    let faceRecogData = {};
    let faceLiveData = {};
    let idLiveData = {};

    // Define allowed document types
    const allowedOneSideDocs = ["passport", "dl", "pan-card"];
    const allowedBothSideDocs = ["aadhaar-card", "voter-id"];

    // 1️⃣ **ID Recognition Based on Document Type**
    if (kycData?.idType) {
      if (allowedBothSideDocs.includes(kycData.idType)) {
        idRecogData.recognitionResult = await handleAPICall(
          "ID Recognition (Front & Back)",
          () =>
            FaceOnLiveAPI.idRecognition(frontDocumentPath, backDocumentPath),
          errorLogs
        );
      } else if (allowedOneSideDocs.includes(kycData.idType)) {
        idRecogData.recognitionResult = await handleAPICall(
          "ID Recognition (Front only)",
          () => FaceOnLiveAPI.idRecognitionOneSide(frontDocumentPath),
          errorLogs
        );
      }
      // Compare extracted ID data with KYC data if recognition succeeded
      if (idRecogData.recognitionResult) {
        const { isMatch, mismatchResults } = ocrService.compareDocumentByType(
          kycData.idType,
          idRecogData.recognitionResult.data[0].data.ocr,
          kycData
        );
        idRecogData.isMatch = isMatch;

        if (!isMatch) {
          //console.log(mismatchResults);
          idRecogData.mismatchResults = mismatchResults
            ? mismatchResults
            : null;
        }
      } else {
        errorLogs.push(
          "ID Recognition failed, so comparison could not be performed."
        );
      }
    }

    // 2️⃣ **Face Comparison**
    faceRecogData = await handleAPICall(
      "Face Comparison",
      () => FaceOnLiveAPI.compareFace(frontDocumentPath, selfiePath),
      errorLogs
    );

    // 3️⃣ **Face Liveness Detection**
    faceLiveData = await handleAPICall(
      "Face Liveness check",
      () => FaceOnLiveAPI.faceLiveness(selfiePath),
      errorLogs
    );

    // 4️⃣ **ID Liveness Detection**
    idLiveData = await handleAPICall(
      "ID Liveness check",
      () => FaceOnLiveAPI.idLiveness(frontDocumentPath),
      errorLogs
    );

    // Determine final status
    const status = errorLogs.length === 0 ? "Completed" : "Failed";

    // Update Moderation record in the database
    await Moderation.findByIdAndUpdate(moderationEntry._id, {
      idRecogData,
      faceRecogData,
      faceLiveData,
      idLiveData,
      errorLogs,
      status,
    });

    console.log(
      `Moderation checks completed for KYC ID: ${kycId}. Status: ${status}`
    );
    return { status, errorLogs };
  } catch (error) {
    console.error(
      `Error running moderation for KYC ID ${kycId}:`,
      error.message
    );

    // If the moderation entry already exists, update it with the error
    await Moderation.findOneAndUpdate(
      { kycId },
      {
        $push: { errorLogs: error.message },
        status: "Failed",
      },
      { upsert: true }
    );

    return { status: "Failed", error: error.message };
  }
};

// 🔹 Helper function to handle API calls and error logging
const handleAPICall = async (taskName, apiCall, errorLogs) => {
  try {
    //console.log(`Performing ${taskName}...`);
    const result = await apiCall();
    //console.log(JSON.stringify(result));
    if (!result) {
      errorLogs.push(`${taskName} failed.`);
    }
    return result;
  } catch (error) {
    errorLogs.push(`${taskName} error: ${error.message}`);
    console.error(`${taskName} error:`, error.message);
    return null;
  }
};

/**
 * Delete all moderations associated with a specific KYC ID
 * @param {String} kycId - The KYC ID for which moderations need to be deleted
 * @returns {Object} - A confirmation message or error
 */
const deleteModerationsByKycId = async (kycId) => {
  try {
    //check if this kycId have any moderations first
    const moderation = await Moderation.findOne({ kycId });
    if (!moderation) {
      return { message: "No moderations found for this KYC ID" };
    }
    const result = await Moderation.deleteMany({ kycId });
    if (result.deletedCount > 0) {
      return {
        message: `Successfully deleted ${result.deletedCount} moderation(s) for KYC ID: ${kycId}`,
      };
    } else {
      return {
        message: `No moderation entries found for KYC ID: ${kycId}`,
      };
    }
  } catch (error) {
    console.error("Error deleting moderations:", error.message);
    throw new Error(
      "Error deleting moderation entries for the provided KYC ID"
    );
  }
};

module.exports = { runModerationChecks, deleteModerationsByKycId };
