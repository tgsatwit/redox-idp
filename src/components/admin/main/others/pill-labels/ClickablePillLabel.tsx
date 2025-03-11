import React, { ReactNode } from "react";

interface ClickablePillLabelProps {
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
  /**
   * Click handler for the pill
   */
  onClick?: () => void;
  /**
   * Hover background color class
   */
  hoverBg?: string;
  /**
   * Whether the pill is active
   */
  isActive?: boolean;
  /**
   * Active background color class
   */
  activeBg?: string;
}

/**
 * ClickablePillLabel component that displays text in a clickable pill format
 * with optional icon, following the application's color scheme
 */
const ClickablePillLabel: React.FC<ClickablePillLabelProps> = ({
  label,
  icon,
  bg = "bg-brand-50",
  iconColor = "text-brand-600",
  solid,
  mb = "mb-2",
  className = "",
  onClick,
  hoverBg = "hover:bg-opacity-80",
  isActive = false,
  activeBg = "bg-brand-600",
}) => {
  const baseClasses = `inline-flex items-center px-3 py-1 rounded-full 
    transition-colors duration-200 cursor-pointer ${hoverBg} ${mb} ${className}`;
  
  const bgClass = isActive ? activeBg : bg;
  const textClass = solid || isActive
    ? "text-white dark:!text-navy-900"
    : "text-navy-700 dark:!text-white";
  
  return (
    <div
      className={`${baseClasses} ${bgClass}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {icon && (
        <span className={`mr-1.5 text-lg ${isActive ? "text-white dark:!text-navy-900" : iconColor}`}>
          {icon}
        </span>
      )}
      <span className={`text-sm font-medium ${textClass}`}>
        {label}
      </span>
    </div>
  );
};

export default ClickablePillLabel; 