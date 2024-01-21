import 'dotenv/config'; 
import express from 'express';
import axios from 'axios';

import forge from 'node-forge';
import cors from 'cors';

// Load sensitive information from environment variables
const publicKeyString = process.env.PUBLIC_KEY;
const hexEncodedEntitySecret = process.env.ENTITY_SECRET;
const apiKey = process.env.API_KEY;



const app = express();
const port = 5000; // Choose a port of your choice

app.use(cors());

app.use(express.json());

// Your generateSecureUUID function
function generateSecureUUID() {
    // Generate an array of 16 random bytes using the crypto API
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);

    // Set the version (4) and variant (random) bits
    randomBytes[6] = (randomBytes[6] & 0x0F) | 0x40;
    randomBytes[8] = (randomBytes[8] & 0x3F) | 0x80;

    // Convert the array of bytes to a hex string
    const uuidHex = Array.from(randomBytes).map(byte => byte.toString(16).padStart(2, '0')).join('');

    // Format the UUID
    const formattedUUID = `${uuidHex.substring(0, 8)}-${uuidHex.substring(8, 12)}-${uuidHex.substring(12, 16)}-${uuidHex.substring(16, 20)}-${uuidHex.substring(20)}`;

    return formattedUUID;
}

// The following sample codes generate a distinct entity secret ciphertext with each execution
function generateEntitySecretCiphertext() {
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

  return base64EncryptedData;
}


app.post('/perform-transfer', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
