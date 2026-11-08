/**
 * -----------------------------------------------------------------------------
 * Form Shared Types
 * -----------------------------------------------------------------------------
 *
 * Centralized types used across all reusable form controls.
 *
 * Every form component should import types from this file instead of directly
 * importing React Hook Form types.
 *
 * This provides:
 * ✔ Consistency
 * ✔ Better maintainability
 * ✔ Future extensibility
 * -----------------------------------------------------------------------------
 */

import type { ReactNode } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import type { Input } from "@/components/ui/input";

/* -------------------------------------------------------------------------- */
/*                              RHF Helper Types                              */
/* -------------------------------------------------------------------------- */

export type FormFieldValues = FieldValues;

export type FormFieldName<T extends FormFieldValues> = Path<T>;

export type FormFieldControl<T extends FormFieldValues> = Control<T>;

/* -------------------------------------------------------------------------- */
/*                               Common Types                                 */
/* -------------------------------------------------------------------------- */

export type FieldSize = "sm" | "md" | "lg";

export type FieldVariant = "default" | "filled" | "ghost";

export type LabelPosition = "top" | "left";

/* -------------------------------------------------------------------------- */
/*                             Select Option Type                             */
/* -------------------------------------------------------------------------- */

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/*                           Base Form Field Props                            */
/* -------------------------------------------------------------------------- */

export interface BaseFormFieldProps<T extends FormFieldValues> {
  /**
   * RHF Field Name
   */
  name: FormFieldName<T>;

  /**
   * Input Label
   */
  label: string;

  /**
   * Placeholder
   */
  placeholder?: string;

  /**
   * Helper text
   */
  description?: string;

  /**
   * Required *
   */
  required?: boolean;

  /**
   * Disable field
   */
  disabled?: boolean;

  /**
   * Readonly field
   */
  readOnly?: boolean;

  /**
   * Wrapper class
   */
  className?: string;

  /**
   * Label Position
   */
  labelPosition?: LabelPosition;

  /**
   * Field Size
   */
  size?: FieldSize;

  /**
   * Variant
   */
  variant?: FieldVariant;

  /**
   * Tooltip
   */
  tooltip?: string;

  /**
   * Loading
   */
  loading?: boolean;

  /**
   * Left Icon
   */
  leftIcon?: ReactNode;

  /**
   * Right Icon
   */
  rightIcon?: ReactNode;

  /**
   * Prefix
   */
  prefix?: ReactNode;

  /**
   * Suffix
   */
  suffix?: ReactNode;

  /**
   * Show Character Counter
   */
  showCharacterCount?: boolean;

  /**
   * Clear Button
   */
  clearable?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Form Input Props                              */
/* -------------------------------------------------------------------------- */

export type FormInputProps<T extends FormFieldValues> = BaseFormFieldProps<T> &
  Omit<React.ComponentPropsWithoutRef<typeof Input>, "name">;
