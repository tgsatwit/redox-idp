import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

// Create context for select state management
interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
}

interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, value: controlledValue, defaultValue, onValueChange, disabled = false, children, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(controlledValue || defaultValue || "");
    
    // Handle controlled component
    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);
    
    const handleChange = (newValue: string) => {
      if (controlledValue === undefined) {
        setValue(newValue);
      }
      if (onValueChange) {
        onValueChange(newValue);
      }
      setOpen(false);
    };
    
    // Close dropdown when clicking outside
    const selectRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
    
    return (
      <SelectContext.Provider value={{ open, setOpen, value, onChange: handleChange }}>
        <div 
          ref={ref || selectRef}
          className={cn("relative", className)}
          data-state={open ? "open" : "closed"}
          {...props}
        >
          {children}
        </div>
      </SelectContext.Provider>
    );
  }
);
Select.displayName = "Select";

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, value, onChange } = useSelectContext();
    
    return (
      <button
        type="button"
        ref={ref}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        aria-expanded={open}
        {...props}
      >
        {children}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={cn("h-4 w-4 opacity-50", open && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder = "Select an option", ...props }, ref) => {
    const { value } = useSelectContext();
    
    return (
      <span 
        ref={ref}
        className={cn("block truncate", className)}
        {...props}
      >
        {value || placeholder}
      </span>
    );
  }
);
SelectValue.displayName = "SelectValue";

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelectContext();
    
    if (!open) return null;
    
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
          "left-0 top-full mt-1",
          className
        )}
        {...props}
      >
        <div className="w-full p-1">
          {children}
        </div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectGroup = React.forwardRef<HTMLDivElement, SelectGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("overflow-hidden p-1", className)}
      role="group"
      {...props}
    />
  )
);
SelectGroup.displayName = "SelectGroup";

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onChange } = useSelectContext();
    const isSelected = selectedValue === value;
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          isSelected && "bg-accent text-accent-foreground",
          className
        )}
        onClick={() => onChange(value)}
        role="option"
        aria-selected={isSelected}
        data-state={isSelected ? "checked" : "unchecked"}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </span>
        <span className="truncate">{children || value}</span>
      </button>
    );
  }
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem }; 