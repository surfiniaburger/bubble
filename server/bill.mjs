import fetch from 'node-fetch';
import forge from 'node-forge';
import 'dotenv/config';



// Load sensitive information from environment variables
const publicKeyString = process.env.PUBLIC_KEY;
const hexEncodedEntitySecret = process.env.ENTITY_SECRET;
const apiKey = process.env.API_KEY;

// Your generateSecureUUID function
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
     const formattedUUID = await `${uuidHex.substring(0, 8)}-${uuidHex.substring(8, 12)}-${uuidHex.substring(12, 16)}-${uuidHex.substring(16, 20)}-${uuidHex.substring(20)}`;
 
     console.log(formattedUUID)
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
  const base64EncryptedData = await forge.util.encode64(encryptedData);

  console.log( base64EncryptedData);
}


const url = 'https://api.circle.com/v1/w3s/developer/transactions/transfer';
const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    authorization: 'Bearer TEST_API_KEY:fecbd21d9c360b606a6fb648c946fb91:03a977007ac0a8572eaf1b818ecb0386'
  },
  body: JSON.stringify({
    amounts: ['0.01'],
    feeLevel: 'MEDIUM',
    tokenId: '7adb2b7d-c9cd-5164-b2d4-b73b088274dc',
    walletId: '113684c0-c8ae-5a76-8ffe-11e2bc0ac99a',
    entitySecretCiphertext: 'WITFhU1Ftv+ypmPczEIks8qVGvhEhHZg6EWtnGjCMfWzOjvuMMG4ruQQoQIAzrvtUbMUOXsDRKFfu4bN5qJb4GSMzqgdtgUjkvbSYkH8Rb+95f3bH8iThnDdM2qb+wnCd0wsGYZThM3vFrB7lngoXR/QEQlkh1+6hMz2ycB9+7guKNSJ3lfgEQtFb2JX7cBdnmU9v5QzeJapmtOqqpA2JN2wBBDvkp78OH/9dO8tKE3JBevSbhl2GGKSejQfeqPTkWe83DZggoUmx76XOsKPTyFdr0GKaPEVcRlsT/9Icjk8oTD9aMDOkXNmbCC7J5ZMyOcPvQL/oOPO9JXJHK4ZYXHzYCuJwGNg7RQUe/UiMQjVoXDJgmlUHdpZqvrHxy7+3QBoF6vfHILxQ90SiVxBFDSXMNN+UKJKWSDoj31qxJlsKrSVLHo8NJkqwpcd2efIdsWEr2jaf7BGwqDBgO7RDdKsWCiWJFdapArO6K/8roArcK+Wv4vyqHIPuk+hzh7Yz+72ZrJx7cRDnxuqmsUukWSJ7bpV5MF/Aiw/aa/zpUuJOaMbt++Spovn1JH+2C1egQMXNpFQ8UwVg7tUf6nfnD12Ynu6q+kmjWpoWXYskpGSHOz6337EsyC3hFYbHM4BAS3M/2/78eqmwSmWY0G4HCqqZD0rztJdT5aJrzSvgiM=',
    destinationAddress: '0xceff020bbebf93c13a79940831a9310370f13ce9',
    idempotencyKey: 'febdffea-d3d7-414f-aa21-8dc419417585'
  })
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error('error:' + err));