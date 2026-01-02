import { forwardRef } from "react";
import { cn } from "../../utils/helpers";

const Select = forwardRef(
  (
    {
      label,
      error,
      options = [],
      placeholder = "Select an option",
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

        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-3 bg-neutral-800 border rounded-lg",
            "text-neutral-100",
            "transition-all duration-300",
            "focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20",
            "cursor-pointer",
            error ? "border-error-500" : "border-neutral-600",
            className
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-2 text-sm text-error-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
