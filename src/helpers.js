export async function dekryptTurnUserAndPass(encryptedValue, decryptionKeyForCreds) {
  try {
    const keyBuffer = new TextEncoder().encode(decryptionKeyForCreds);
    const keyHashBuffer = await crypto.subtle.digest("SHA-256", keyBuffer);
    const keyHash = new Uint8Array(keyHashBuffer);

    const encryptedBytes = base64ToBytes(encryptedValue);

    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyHash[i % keyHash.length];
    }
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
