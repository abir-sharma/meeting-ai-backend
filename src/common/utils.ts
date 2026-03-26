export function splitName(name: string) {
  const parts = name.trim().split(' ');
  
  const firstName = parts[0];
  const lastName = parts.length > 1
    ? parts.slice(1).join(' ')
    : ''; // fallback

    return { firstName, lastName };
}

export function generateRandomPassword(length: number = 10): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}