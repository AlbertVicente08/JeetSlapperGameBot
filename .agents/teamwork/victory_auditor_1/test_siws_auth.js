const crypto = require('crypto');

// Generate an Ed25519 keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

// Message format specified in Prompt 2:
// "Sign-in to Jeet Slapper with Telegram ID: <telegramId> at <timestamp>"
const telegramId = '123456789';
const timestamp = Math.floor(Date.now() / 1000);
const validMessage = `Sign-in to Jeet Slapper with Telegram ID: ${telegramId} at ${timestamp}`;

// Sign the message with genuine private key
const validSignature = crypto.sign(null, Buffer.from(validMessage), privateKey);

// Verify valid signature
const isGenuine = crypto.verify(null, Buffer.from(validMessage), publicKey, validSignature);
console.log('1. Genuine wallet signature verified:', isGenuine ? 'PASS' : 'FAIL');

// Attack Scenario 1: Attacker tries to bind someone else's public address without their private key
const attackerKeyPair = crypto.generateKeyPairSync('ed25519');
const forgedSignature = crypto.sign(null, Buffer.from(validMessage), attackerKeyPair.privateKey);
const isForgedValid = crypto.verify(null, Buffer.from(validMessage), publicKey, forgedSignature);
console.log('2. Impersonation attack with foreign private key rejected:', !isForgedValid ? 'PASS' : 'FAIL');

// Attack Scenario 2: Attacker intercepts valid signature but tries to change the Telegram ID in message
const tamperedMessage = `Sign-in to Jeet Slapper with Telegram ID: 999999999 at ${timestamp}`;
const isTamperedValid = crypto.verify(null, Buffer.from(tamperedMessage), publicKey, validSignature);
console.log('3. Tampered Telegram ID message rejected:', !isTamperedValid ? 'PASS' : 'FAIL');
