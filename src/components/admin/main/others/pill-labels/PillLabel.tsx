import React, { ReactNode } from "react";

interface PillLabelProps {
  /**
   * Label text to display
   */
  label: string;
  /**
   * Optional icon to display before the label
   */
  icon?: ReactNode;
  /**
   * Background color class
   */
  bg?: string;
  /**
   * Icon color class
   */
  iconColor?: string;
  /**
   * Whether the pill should have solid styling
   */
  solid?: string;
  /**
   * Additional margin bottom class
   */
  mb?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * PillLabel component that displays text in a pill format
 * with optional icon, following the application's color scheme
 */
const PillLabel: React.FC<PillLabelProps> = ({
  label,
  icon,
  bg = "bg-brand-50",
  iconColor = "text-brand-600",
  solid,
  mb = "mb-2",
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full ${bg} ${mb} ${className}`}
    >
      {icon && <span className={`mr-1 text-lg ${iconColor}`}>{icon}</span>}
      <span
        className={`text-sm font-medium ${
          solid
            ? "text-white dark:!text-navy-900"
            : "text-navy-700 dark:!text-white"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export default PillLabel; 