import React from 'react';

export interface ClickablePillLabelProps {
  label: string;
  icon: React.ReactNode;
  iconColor?: string;
  bg?: string;
  mb?: string;
  onClick: () => void;
}

const ClickablePillLabel: React.FC<ClickablePillLabelProps> = ({ label, icon, iconColor, bg, mb, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3 py-1 rounded-full ${bg ? bg : 'bg-gray-200'} ${mb ? mb : ''} hover:opacity-90 transition-opacity`}
    >
      <span className={`${iconColor ? iconColor : 'text-gray-600'} mr-2`}>
        {icon}
      </span>
      <span className="text-sm font-medium text-gray-800 dark:text-white">{label}</span>
    </button>
  );
};

export default ClickablePillLabel; 