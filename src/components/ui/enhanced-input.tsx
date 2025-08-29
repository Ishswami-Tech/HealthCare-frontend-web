"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Search, X } from "lucide-react";

const inputVariants = cva(
  "flex w-full rounded-lg border border-input bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        filled: "bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-input",
        underline: "border-0 border-b-2 border-b-input rounded-none bg-transparent focus-visible:border-b-ring",
        ghost: "border-transparent bg-transparent focus-visible:bg-muted/50 focus-visible:border-input",
      },
      size: {
        sm: "h-8 px-3 py-1 text-sm",
        md: "h-10 px-3 py-2",
        lg: "h-12 px-4 py-3 text-lg",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive/20",
        success: "border-success-500 focus-visible:ring-success-500/20",
        warning: "border-warning-500 focus-visible:ring-warning-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
    },
  }
);

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

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
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
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = React.useId();

    // Determine the actual state based on props
    const actualState = error ? "error" : success ? "success" : state;
    
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    
    const hasValue = value !== undefined && value !== "";
    const showClearButton = clearable && hasValue && !disabled && !loading;

    return (
      <div className="space-y-2">
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
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            
            {showClearButton && (
              <button
                type="button"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {isPassword && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {rightIcon && !loading && !showClearButton && !isPassword && (
              <div className="text-muted-foreground">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        
        {(description || error || success) && (
          <div className="flex items-start space-x-1">
            {error && <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />}
            {success && <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />}
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
);
Input.displayName = "Input";

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (query: string) => void;
  searchDelay?: number;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, searchDelay = 300, ...props }, ref) => {
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
        leftIcon={<Search className="h-4 w-4" />}
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
);
SearchInput.displayName = "SearchInput";

// Textarea Component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    Pick<InputProps, "variant" | "size" | "state" | "label" | "description" | "error" | "success"> {
  resize?: boolean;
  autoHeight?: boolean;
  maxHeight?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
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
    ...props
  }, ref) => {
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
      <div className="space-y-2">
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
          <div className="flex items-start space-x-1">
            {error && <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />}
            {success && <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />}
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
);
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

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, label, description, error, success, required, className }, ref) => {
    const fieldId = React.useId();

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
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
          <div className="flex items-start space-x-1">
            {error && <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />}
            {success && <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />}
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
);
FormField.displayName = "FormField";

export { Input, SearchInput, Textarea, FormField, inputVariants };