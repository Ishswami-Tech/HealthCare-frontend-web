"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Search, X } from "lucide-react";
import { inputVariants } from "@/components/ui/enhanced-input-utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

type InputComponentProps = InputProps & {
  ref?: React.Ref<HTMLInputElement> | undefined;
};

function Input({
  className,
  type,
  variant,
  size,
  state,
  label,
  description,
  error,
  success,
  loading,
  leftIcon,
  rightIcon,
  clearable,
  onClear,
  value,
  disabled,
  ref,
  ...props
}: InputComponentProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputId = React.useId();

  // Determine the actual state based on props
  const actualState = error ? "error" : success ? "success" : state;

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const hasValue = value !== undefined && value !== "";
  const showClearButton = clearable && hasValue && !disabled && !loading;

  return (
    <div className="gap-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          type={inputType}
          className={cn(
            inputVariants({ variant, size, state: actualState }),
            leftIcon && "pl-10",
            (rightIcon || isPassword || loading || showClearButton) && "pr-10",
            className
          )}
          ref={ref}
          value={value}
          disabled={disabled || loading}
          {...props}
        />

        <div className="absolute right-3 top-1/2 flex items-center gap-x-1 -translate-y-1/2">
          {loading && (
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          )}

          {showClearButton && (
            <button
              type="button"
              onClick={onClear}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}

          {isPassword && !loading && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          )}

          {rightIcon && !loading && !showClearButton && !isPassword && (
            <div className="text-muted-foreground">{rightIcon}</div>
          )}
        </div>
      </div>

      {(description || error || success) && (
        <div className="flex items-start gap-x-1">
          {error && (
            <AlertCircle className="text-destructive mt-0.5 size-4 flex-shrink-0" />
          )}
          {success && (
            <CheckCircle className="text-success-500 mt-0.5 size-4 flex-shrink-0" />
          )}
          <p
            className={cn(
              "text-sm",
              error && "text-destructive",
              success && "text-success-600",
              !error && !success && "text-muted-foreground"
            )}
          >
            {error || success || description}
          </p>
        </div>
      )}
    </div>
  );
}

Input.displayName = "Input";

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (query: string) => void;
  searchDelay?: number;
}

type SearchInputComponentProps = SearchInputProps & {
  ref?: React.Ref<HTMLInputElement> | undefined;
};

function SearchInput({
  onSearch,
  searchDelay = 300,
  ref,
  ...props
}: SearchInputComponentProps) {
  const [searchQuery, setSearchQuery] = React.useState(props.value || "");
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  React.useEffect(() => {
    if (onSearch) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onSearch?.(String(searchQuery));
      }, searchDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, onSearch, searchDelay]);

  return (
    <Input
      {...props}
      ref={ref}
      type="search"
      leftIcon={<Search className="size-4" />}
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        props.onChange?.(e);
      }}
      clearable
      onClear={() => {
        setSearchQuery("");
        onSearch?.("");
      }}
    />
  );
}

SearchInput.displayName = "SearchInput";

// Textarea Component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    Pick<InputProps, "variant" | "size" | "state" | "label" | "description" | "error" | "success"> {
  resize?: boolean;
  autoHeight?: boolean;
  maxHeight?: number;
}

type TextareaComponentProps = TextareaProps & {
  ref?: React.Ref<HTMLTextAreaElement> | undefined;
};

function Textarea({
  className,
  variant = "default",
  size = "md",
  state,
  label,
  description,
  error,
  success,
  resize = true,
  autoHeight = false,
  maxHeight = 300,
  ref,
  ...props
}: TextareaComponentProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const inputId = React.useId();

  // Determine the actual state based on props
  const actualState = error ? "error" : success ? "success" : state;

  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && autoHeight) {
      textarea.style.height = "auto";
      const scrollHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [autoHeight, maxHeight]);

  React.useEffect(() => {
    if (autoHeight) {
      adjustHeight();
    }
  }, [adjustHeight, props.value]);

  return (
    <div className="gap-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}

      <textarea
        id={inputId}
        className={cn(
          inputVariants({ variant, size, state: actualState }),
          "min-h-[80px]",
          !resize && "resize-none",
          autoHeight && "resize-none overflow-hidden",
          className
        )}
        ref={textareaRef}
        style={autoHeight ? { maxHeight: `${maxHeight}px` } : undefined}
        onChange={(e) => {
          props.onChange?.(e);
          if (autoHeight) {
            adjustHeight();
          }
        }}
        {...props}
      />

      {(description || error || success) && (
        <div className="flex items-start gap-x-1">
          {error && (
            <AlertCircle className="text-destructive mt-0.5 size-4 flex-shrink-0" />
          )}
          {success && (
            <CheckCircle className="text-success-500 mt-0.5 size-4 flex-shrink-0" />
          )}
          <p
            className={cn(
              "text-sm",
              error && "text-destructive",
              success && "text-success-600",
              !error && !success && "text-muted-foreground"
            )}
          >
            {error || success || description}
          </p>
        </div>
      )}
    </div>
  );
}

Textarea.displayName = "Textarea";

// Form Field Wrapper
export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  className?: string;
}

type FormFieldComponentProps = FormFieldProps & {
  ref?: React.Ref<HTMLDivElement> | undefined;
};

function FormField({
  children,
  label,
  description,
  error,
  success,
  required,
  className,
  ref,
}: FormFieldComponentProps) {
  const fieldId = React.useId();

  return (
    <div ref={ref} className={cn("gap-y-2", className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, { id: fieldId } as any)}
      </div>

      {(description || error || success) && (
        <div className="flex items-start gap-x-1">
          {error && (
            <AlertCircle className="text-destructive mt-0.5 size-4 flex-shrink-0" />
          )}
          {success && (
            <CheckCircle className="text-success-500 mt-0.5 size-4 flex-shrink-0" />
          )}
          <p
            className={cn(
              "text-sm",
              error && "text-destructive",
              success && "text-success-600",
              !error && !success && "text-muted-foreground"
            )}
          >
            {error || success || description}
          </p>
        </div>
      )}
    </div>
  );
}

FormField.displayName = "FormField";

export { Input, SearchInput, Textarea, FormField };

