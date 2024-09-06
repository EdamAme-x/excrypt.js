/**
 * @module
 * Excrypt.js is super easy and secure encryption library.
 */

/**
 * @description Encrypts the given data with the given password, returning a
 * base64-encoded string.
 *
 * The returned string is in the format:
 * `<data>.<verify>`
 *
 * The first part, `<data>`, is the encrypted data, and the second part,
 * `<verify>`, is used to verify the integrity of the encrypted data.
 *
 * @param {string | Uint8Array} data The data to be encrypted.
 * @param {string | Uint8Array} password The password to be used for encryption.
 * @returns A base64-encoded string containing the encrypted data.
 */
export async function encrypt(
  data: string | Uint8Array,
  password: string | Uint8Array,
  options: {
    salt: string | Uint8Array;
    stretching: number;
  } = {
    salt: "excryptjs_$$$_$$$",
    stretching: 2 ** 8,
  },
): Promise<string> {
  const dataBuffer =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hashedDataBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const saltBuffer =
    typeof options.salt === "string"
      ? new TextEncoder().encode(options.salt)
      : options.salt;
  const passwordBuffer =
    typeof password === "string"
      ? new TextEncoder().encode(password)
      : password;

  let passwordBufferHashed: ArrayBuffer | null = null;

  for (let i = 0, iterations = options.stretching; i < iterations; i++) {
    passwordBufferHashed = await crypto.subtle.digest(
      "SHA-256",
      new Uint8Array([
        ...saltBuffer,
        ...new Uint8Array(
          passwordBufferHashed ? passwordBufferHashed : passwordBuffer,
        ),
      ]),
    );
  }

  const verifyBuffer = xor(hashedDataBuffer, passwordBufferHashed!);

  return (
    encodeUint8ArrayToBase64(
      xor(
        new Uint8Array([...dataBuffer, ...new Uint8Array(hashedDataBuffer)]),
        hashedDataBuffer,
      ),
    ) +
    "." +
    encodeUint8ArrayToBase64(verifyBuffer)
  );
}

/**
 * @description Decrypts the given encrypted string with the given password, returning a
 * `string` if `parseString` is true, or a `Uint8Array` if `parseString` is
 * false.
 *
 * @param {string} encryptedString The encrypted string to be decrypted.
 * @param {string | Uint8Array} password The password to be used for
 * decryption.
 * @param {boolean} [parseString=true] If true, the decrypted data will be
 * returned as a `string`. Otherwise, it will be returned as a `Uint8Array`.
 * @returns A `string` or `Uint8Array` containing the decrypted data.
 */
export async function decrypt<B extends boolean = true>(
  encryptedString: string,
  password: string | Uint8Array,
  options: {
    parseString: B;
    salt: string | Uint8Array;
    stretching: number;
  } = {
    parseString: true as B,
    salt: "excryptjs_$$$_$$$",
    stretching: 2 ** 8,
  },
): Promise<B extends true ? string : Uint8Array> {
  const [dataBuffer, verifyBuffer] = encryptedString
    .split(".")
    .map(decodeUint8ArrayToBase64);
  const saltBuffer =
    typeof options.salt === "string"
      ? new TextEncoder().encode(options.salt)
      : options.salt;

  const passwordBuffer =
    typeof password === "string"
      ? new TextEncoder().encode(password)
      : password;

  let passwordBufferHashed: ArrayBuffer | null = null;

  for (let i = 0, iterations = options.stretching; i < iterations; i++) {
    passwordBufferHashed = await crypto.subtle.digest(
      "SHA-256",
      new Uint8Array([
        ...saltBuffer,
        ...new Uint8Array(
          passwordBufferHashed ? passwordBufferHashed : passwordBuffer,
        ),
      ]),
    );
  }

  const decryptedHashedDataBuffer = xor(verifyBuffer, passwordBufferHashed!);

  const decryptedData = xor(dataBuffer, decryptedHashedDataBuffer).slice(
    0,
    dataBuffer.length - decryptedHashedDataBuffer.length,
  );

  if (options.parseString) {
    // typescript limitation
    return atob(encodeUint8ArrayToBase64(decryptedData)) as any;
  } else {
    // typescript limitation
    return decryptedData as any;
  }
}

function xor(
  a: Uint8Array | ArrayBuffer,
  b: Uint8Array | ArrayBuffer,
): Uint8Array {
  const aArray = a instanceof ArrayBuffer ? new Uint8Array(a) : a;
  const bArray = b instanceof ArrayBuffer ? new Uint8Array(b) : b;

  const maxLength = Math.max(aArray.length, bArray.length);

  const result = new Uint8Array(maxLength);

  for (let i = 0; i < maxLength; i++) {
    result[i] = aArray[i % aArray.length] ^ bArray[i % bArray.length];
  }

  return result;
}

function encodeUint8ArrayToBase64(uint8Array: Uint8Array) {
  return btoa(String.fromCharCode(...uint8Array));
}

function decodeUint8ArrayToBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0, len = binaryString.length; i < len; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}
