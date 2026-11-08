import type { FieldValues, Path } from "react-hook-form";
import { FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldWrapper } from "./base";
import type { SelectOption } from "./form.types";

type FormSelectProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  description,
  disabled,
  required,
  className,
}: FormSelectProps<T>) {
  return (
    <FormFieldWrapper<T>
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
    >
      {(field) => (
        <Select
          name={field.name}
          value={field.value}
          onValueChange={field.onChange}
          disabled={disabled}
          required={required}
        >
          <FormControl>
            <SelectTrigger
              ref={field.ref}
              onBlur={field.onBlur}
              aria-required={required}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>

          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormFieldWrapper>
  );
}