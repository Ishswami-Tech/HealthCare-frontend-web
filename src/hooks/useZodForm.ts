import { UseMutateFunction } from "@tanstack/react-query";
import { useForm, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const useZodForm = <T extends z.ZodType>(
  schema: T,
  mutation: UseMutateFunction<unknown, unknown, z.infer<T>>,
  defaultValues?: DefaultValues<z.infer<T>>
) => {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onFormSubmit = handleSubmit((values) => {
    try {
      mutation(values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  });

  return {
    register,
    watch,
    reset,
    onFormSubmit,
    getValues,
    errors,
  };
};

export default useZodForm;
