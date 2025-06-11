import { UseMutateFunction } from "@tanstack/react-query";
import { useForm, DefaultValues, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const useZodForm = <T extends z.ZodType>(
  schema: T,
  mutation: UseMutateFunction<unknown, unknown, z.infer<T>>,
  defaultValues?: DefaultValues<z.infer<T>>
): UseFormReturn<z.infer<T>> & {
  onFormSubmit: () => Promise<void>;
} => {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const onFormSubmit = form.handleSubmit(async (values) => {
    try {
      await Promise.resolve(mutation(values));
    } catch (error) {
      console.error('Form submission error:', error);
      // Re-throw the error so it can be caught by the form's error handler
      throw error;
    }
  });

  return {
    ...form,
    onFormSubmit,
  };
};

export default useZodForm;
