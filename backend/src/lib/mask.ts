export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "*****";
  return `${local[0]}*****@${domain}`;
}
