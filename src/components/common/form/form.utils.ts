/**
 * -----------------------------------------------------------------------------
 * Form Utilities
 * -----------------------------------------------------------------------------
 */

import type { SelectOption } from "./form.types";

/**
 * Returns total characters.
 */
export const getCharacterCount = (value?: string) => value?.length ?? 0;

/**
 * Remaining characters.
 */
export const getRemainingCharacters = (value: string = "", maxLength: number) =>
  Math.max(maxLength - value.length, 0);

/**
 * Empty string helper.
 */
export const isEmpty = (value?: string) =>
  value === undefined || value === null || value.trim() === "";

/**
 * Convert array into Select Options.
 */
export function buildSelectOptions<T extends Record<string, unknown>>(
  items: T[],
  labelKey: keyof T,
  valueKey: keyof T,
): SelectOption[] {
  return items.map((item) => ({
    label: String(item[labelKey]),
    value: String(item[valueKey]),
  }));
}
