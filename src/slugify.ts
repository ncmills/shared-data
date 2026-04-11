/**
 * URL slug generator. Same behavior across all projects.
 *
 *   slugify("Pinehurst No. 2")           → "pinehurst-no-2"
 *   slugify("Coeur d'Alene")              → "coeur-dalene"
 *   slugify("New York & New Jersey")      → "new-york-and-new-jersey"
 */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
