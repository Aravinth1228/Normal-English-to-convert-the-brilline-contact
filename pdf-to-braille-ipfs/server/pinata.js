import pinataSDK from '@pinata/sdk';
import fs from 'fs';
import path from 'path';

const {
  PINATA_JWT,
  PINATA_API_KEY,
  PINATA_API_SECRET,
} = process.env;

let pinata;

if (PINATA_JWT && PINATA_JWT.trim() !== '') {
  pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
} else if (PINATA_API_KEY && PINATA_API_SECRET) {
  pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
} else {
  throw new Error('Pinata credentials missing: set PINATA_JWT or API key/secret');
}

export async function pinFile(filePath, metadata = {}) {
  const readableStream = fs.createReadStream(filePath);
  const options = { pinataMetadata: { name: metadata.name || path.basename(filePath), keyvalues: metadata.keyvalues || {} } };
  const res = await pinata.pinFileToIPFS(readableStream, options);
  return res; // { IpfsHash, PinSize, Timestamp }
}

export async function pinJSON(body, metadata = {}) {
  const options = { pinataMetadata: { name: metadata.name || 'metadata.json', keyvalues: metadata.keyvalues || {} } };
  const res = await pinata.pinJSONToIPFS(body, options);
  return res;
}

export default pinata;
