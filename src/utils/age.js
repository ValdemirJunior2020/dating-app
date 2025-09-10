export function parseDob(input) {
  if (!input) return null;
  if (typeof input === "string") {
    const d = new Date(input);
    return isNaN(d) ? null : d;
  }
  if (input?.toDate) {
    const d = input.toDate();
    return isNaN(d) ? null : d;
  }
  try {
    const d = new Date(input);
    return isNaN(d) ? null : d;
  } catch {
    return null;
  }
}

export function calcAge(dobLike) {
  const dob = parseDob(dobLike);
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}
