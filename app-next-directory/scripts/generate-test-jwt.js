#!/usr/bin/env node

/**
 * generate-test-jwt.js
 * Generates a test JWT signed with HS256 using the NEXTAUTH_SECRET.
 * Usage:
 *   NODE_ENV=test node scripts/generate-test-jwt.js [--secret=your-secret] [--role=admin|user|venueOwner]
 */

const { SignJWT } = require('jose');

function parseArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!arg) return undefined;
  return arg.split('=')[1];
}

(async () => {
  const secretInput = parseArg('secret') || process.env.NEXTAUTH_SECRET || 'test-secret';
  const validRoles = ['admin', 'user', 'venueOwner'];
  const inputRole = parseArg('role') || 'admin';
  if (!validRoles.includes(inputRole)) {
    console.error(`Invalid role: ${inputRole}. Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }
  const role = inputRole;
  const id = `test-${Math.random().toString(36).slice(2, 9)}`;
  const email = `${id}@example.com`;

  // jose expects a key: for HS256, use a Uint8Array from secret
  const encoder = new TextEncoder();
  const key = encoder.encode(secretInput);

  // Sign a simple token with claims similar to next-auth/jwt
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24; // 24h

  const token = await new SignJWT({ id, email, name: 'Test User', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(key);

  console.log(token);
})();
