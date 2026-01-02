import { forwardRef } from "react";
import { cn } from "../../utils/helpers";

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("form-field w-full", containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
              <Icon size={20} />
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              "w-full px-4 py-3 bg-neutral-800 border rounded-lg",
              "text-neutral-100 placeholder-neutral-400",
              "transition-all duration-300",
              "focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20",
              error ? "border-error-500" : "border-neutral-600",
              Icon && "pl-12",
              className
            )}
            {...props}
          />
        </div>

        {error && <p className="mt-2 text-sm text-error-400">{error}</p>}

        {helperText && !error && (
          <p className="mt-2 text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
