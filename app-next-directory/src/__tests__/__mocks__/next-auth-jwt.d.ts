// TypeScript module declaration to silence errors for 'next-auth/jwt' in test context
declare module 'next-auth/jwt' {
  export function getToken(...args: any[]): any;
}