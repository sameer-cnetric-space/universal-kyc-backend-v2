const compareAddressApproximately = (ocrAddress, kycAddress) => {
  if (!ocrAddress || !kycAddress) return false;

  // Normalize addresses: remove extra spaces, convert to lowercase
  const normalize = (str) =>
    str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, " ");

  const normalizedOcrAddress = normalize(ocrAddress);
  const normalizedKycAddress = normalize(kycAddress);

  // Tokenize the addresses into words
  const ocrTokens = new Set(normalizedOcrAddress.split(" "));
  const kycTokens = new Set(normalizedKycAddress.split(" "));

  // Calculate intersection size
  const intersection = [...ocrTokens].filter((word) =>
    kycTokens.has(word)
  ).length;

  // Compute similarity score
  const similarity = intersection / Math.max(ocrTokens.size, kycTokens.size);

  const result = similarity >= 0.5;

  // Return true if similarity is above a threshold (e.g., 0.7)
  return {
    similarity,
    result,
  };
};

module.exports = { compareAddressApproximately };
