import type { HTMLInputTypeAttribute } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormFieldWrapper } from "./base";
import { FormControl } from "@/components/ui/form";
type FormInputProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  min?: number;
  step?: number | string;
  autoComplete?: string;
};

export function FormInput<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  type = "text",
  disabled,
  required,
  className,
  min,
  step,
  autoComplete,
}: FormInputProps<T>) {
  return (
    <FormFieldWrapper<T>
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
    >
      {(field) => (
        <FormControl>
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={min}
            step={step}
            autoComplete={autoComplete}
          />
        </FormControl>
      )}
    </FormFieldWrapper>
  );
}
