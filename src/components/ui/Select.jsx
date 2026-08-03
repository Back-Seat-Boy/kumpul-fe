import { forwardRef, useState, useEffect, useRef } from "react";
import { Search, X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export const Select = forwardRef(
  (
    {
      label,
      options,
      error,
      placeholder = "Select an option",
      className = "",
      required = false,
      searchable = false,
      searchValue = "",
      onSearchInput,
      onSearchClear,
      pagination,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const handler = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const selectedLabel =
      options.find((o) => o.value === props.value)?.label || placeholder;

    if (!searchable) {
      return (
        <div className={`w-full ${className}`}>
          {label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <select
            ref={ref}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 hover:border-gray-400"}`}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      );
    }

    return (
      <div className={`w-full ${className}`} ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between bg-white ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 hover:border-gray-400"} focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
        >
          <span className={props.value ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
            {selectedLabel}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-[calc(100%-2rem)] max-w-md bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2 border-b border-gray-100">
              <div className="relative flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    autoFocus
                    value={searchValue}
                    onChange={(e) => onSearchInput?.(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full pl-8 pr-7 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent"
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => onSearchClear?.()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {options.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500 text-center">
                  No locations found
                </p>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      props.onChange?.({ target: { value: option.value } });
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-green-50 ${option.value === props.value ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"}`}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>

            {pagination && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {pagination.page} / {pagination.totalPages || 1}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => pagination.onPrev?.()}
                    disabled={pagination.page <= 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => pagination.onNext?.()}
                    disabled={!pagination.hasMore}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
