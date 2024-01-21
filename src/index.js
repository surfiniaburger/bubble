import { Ai } from "@cloudflare/ai";
import { Hono } from "hono";
import { fetch } from 'node-fetch';
import { forge } from 'node-forge';



// Load sensitive information from environment variables
// const publicKeyString = PUBLIC_KEY;
// const hexEncodedEntitySecret = ENTITY_SECRET;
// const apiKey = API_KEY;

const PUBLIC_KEY=`-----BEGIN RSA PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzgqK362QiV5KKfWwDj1f
QiwZxYJRqQvHrM+s6q3vsK4IDvKNecqjMJzKeVGWNvEnuejcuo7Cn9oQgbWGWrxC
vUlRRfCvefQcEvjbmhCNhczoQHDahQBQ/yZE674+YAnm3PCIDkjDTPdfONLtA13p
3CXF/1b1lmf63UCyiOJV3n5pSxlC4KrUlDUDMO0ED8nr5nGswMr9SZS78AAy0Npl
KIwMIE/Cv7nmxsHG0NMvxMjdsAIHHzrkE93rbd/6th+MPr5umiMPf+k8Y4Alrf9u
2JFho+/Q3ibp/ccReAgjVR9e/tbiy27Kz+gX/w9lrlyfBSOC1no5/lU/HiP5z7zZ
pyDvkcbQk+lO0Ya5aOraXjOR/uPmewgOjMzY7C4z8HSajPZXaWTpcB2r93ivg76h
Gr1yWYAjHl8Vhq/OjrgJqwtpDOWtGxR2crzKD5GWam2oFelNIIe4Kvz8ZUTemuYb
Q5rFGvCZ/AK7SkXnB0benZ0JnpVvgzeaKxkAKz4SrzWOOwkRzy0YGzsuluqPTqEn
uBITtUpftity5SHr97ufgMyynezn7PPBUhndU64erWYgcJ2/qlD4k2Y0rEk6zgOS
YexwUX7XjyjP33Z0/b6X6lfn+1VU47e/ZHvFeMRvD5HpdPYgb61pCfo1tf7n33RD
+4+4iKP3r3Soxa0cYYpCoHkCAwEAAQ==
-----END RSA PUBLIC KEY-----
`
const API_KEY= "TEST_API_KEY:fecbd21d9c360b606a6fb648c946fb91:03a977007ac0a8572eaf1b818ecb0386"

const ENTITY_SECRET="622e168ba93bdd867cd6c5dc8c1c8e215b44264b49ee7911025d296bb8cc1322"

import imageTemplate from "./image-template.html";


const app = new Hono();


app.get("/c", (c) => c.html(imageTemplate));





// Your existing functions for generating UUID and entity secret ciphertext
async function generateSecureUUID() {
  // ... (same as before)
  // Generate an array of 16 random bytes using the crypto API
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  // Set the version (4) and variant (random) bits
  randomBytes[6] = (randomBytes[6] & 0x0F) | 0x40;
  randomBytes[8] = (randomBytes[8] & 0x3F) | 0x80;

  // Convert the array of bytes to a hex string
  const uuidHex = Array.from(randomBytes).map(byte => byte.toString(16).padStart(2, '0')).join('');

  // Format the UUID
  const formattedUUID =  `${uuidHex.substring(0, 8)}-${uuidHex.substring(8, 12)}-${uuidHex.substring(12, 16)}-${uuidHex.substring(16, 20)}-${uuidHex.substring(20)}`;


  return formattedUUID
}

async function generateEntitySecretCiphertext() {
  // ... (same as before)
  const entitySecret = forge.util.hexToBytes(hexEncodedEntitySecret);
  if (entitySecret.length != 32) {
      console.log("invalid entity secret");
      return null;
  }

  // encrypt data by the public key
  const publicKey = forge.pki.publicKeyFromPem(publicKeyString);
  const encryptedData = publicKey.encrypt(entitySecret, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: {
          md: forge.md.sha256.create()
      }
    });

    // encode to base64
    const base64EncryptedData = forge.util.encode64(encryptedData);

    return base64EncryptedData
}



// New route for API call to Circle
app.get("/perform-transfer", async (c) => {
  try {
    // Generate secure UUID (idempotency key)
    const idempotencyKey = await generateSecureUUID();

    // Generate entity secret ciphertext
    const entitySecretCiphertext = await generateEntitySecretCiphertext();

    // API call to Circle
    const url = 'https://api.circle.com/v1/w3s/developer/transactions/transfer';
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        amounts: ['0.01'],
        feeLevel: 'MEDIUM',
        tokenId: '7adb2b7d-c9cd-5164-b2d4-b73b088274dc',
        walletId: '113684c0-c8ae-5a76-8ffe-11e2bc0ac99a',
        entitySecretCiphertext,
        destinationAddress: '0xceff020bbebf93c13a79940831a9310370f13ce9',
        idempotencyKey,
      }),
    };

    // Make the API call
    const response = await fetch(url, options);
    const json = await response.json();
    return c.json(json);
  } catch (error) {
    console.error('Error:', error);
    return c.text('Error in Circle API call');
  }
});

// New route for AI image generation
app.get("/generate-image", async (c) => {
  const ai = new Ai(c.env.AI);

  // Retrieve the prompt from the query parameters
  const prompt = c.req.query("prompt") || 'cyberpunk cat';

  // Customize the prompt for image generation
  const inputs = {
    prompt,
  };

   try{
  // Run AI to generate an image
  const response = await ai.run(
    '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    inputs
  );

  // Return the image response
  return new Response(response, {
    headers: {
      'content-type': 'image/png',
    },
  });
} catch (error) {
  console.error('Error generating image:', error);
  return c.text('Error generating image');
}
});


app.onError((err, c) => {
  return c.text(err);
});

export default app;
