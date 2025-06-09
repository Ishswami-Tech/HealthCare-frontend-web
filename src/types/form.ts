import { FieldValues, UseFormRegister } from 'react-hook-form';

export interface FormFieldProps<T extends FieldValues> {
  field: {
    name: string;
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
  };
  register: UseFormRegister<T>;
} 