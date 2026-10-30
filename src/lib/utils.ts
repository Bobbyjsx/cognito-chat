export { cn } from "@bobslab/utils";

export function capitalizeFirstLetter(string: string) {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}
