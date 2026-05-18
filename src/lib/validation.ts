export function isValidColombianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && digits.startsWith('3');
}

export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
