import { useState, useEffect, forwardRef } from "react";
import { formatNumberWithDots, unformatNumber } from "../../utils/format";

export const CurrencyInput = forwardRef(
  (
    {
      label,
      error,
      placeholder,
      className = "",
      required = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState("");

    // Update display value when value prop changes
    useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatNumberWithDots(value));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e) => {
      const rawValue = e.target.value;
      
      // Remove non-numeric characters except dots
      const numericValue = rawValue.replace(/[^0-9.]/g, "");
      
      // Remove existing dots and parse
      const cleanValue = unformatNumber(numericValue);
      
      // Format with dots for display
      const formatted = formatNumberWithDots(cleanValue);
      
      setDisplayValue(formatted);
      
      // Send unformatted value to parent
      if (onChange) {
        onChange({
          target: {
            name: props.name,
            value: cleanValue === "" ? "" : parseInt(cleanValue, 10),
          },
        });
      }
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            Rp
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400"
            }`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
