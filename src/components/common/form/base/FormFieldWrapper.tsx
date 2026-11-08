import type { ReactElement } from "react";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from "react-hook-form";

type FormFieldWrapperProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: (field: ControllerRenderProps<T, Path<T>>) => ReactElement;
};

export function FormFieldWrapper<T extends FieldValues>({
  name,
  label,
  description,
  required,
  className,
  children,
}: FormFieldWrapperProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}

            {required && (
              <span aria-hidden="true" className="ml-1 text-destructive">
                *
              </span>
            )}
          </FormLabel>

          {children(field)}

          {description && <FormDescription>{description}</FormDescription>}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
