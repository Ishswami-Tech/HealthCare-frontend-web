import { FieldValues, UseFormRegister } from 'react-hook-form';

export interface FormFieldProps<T extends FieldValues> {
  field: {
    name: string;
    value: any;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
  };
  register: UseFormRegister<T>;
} 