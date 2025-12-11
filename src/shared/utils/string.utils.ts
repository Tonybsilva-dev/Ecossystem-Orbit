/**
 * Generates a URL-friendly slug from a string.
 * @param text The text to slugify
 * @returns dashed-lower-case-slug
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normalize special characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, ''); // Trim dashes
}
