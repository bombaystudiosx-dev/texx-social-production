/**
 * Deterministic placeholder avatar for users who haven't uploaded a photo —
 * seeded by uid/username so the same person always gets the same image,
 * instead of a blank circle.
 */
export function avatarUrl(seed: string, photoURL?: string | null): string {
  if (photoURL) return photoURL;
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
