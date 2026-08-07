// Strips everything except digits and caps the result at 10 characters —
// used on every phone number input across the app (Candidate Apply form,
// Corporate HR phone, Campus coordinator phone) so only a plain 10-digit
// Indian mobile number can ever be typed or pasted in.
export function sanitizePhone(value) {
  return (value || '').replace(/\D/g, '').slice(0, 10);
}