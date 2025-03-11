import React, { ReactNode } from 'react';
import Card from '@/components/card';

interface CarTileProps {
  title: string;
  value?: string | number;
  icon?: ReactNode;
  iconColor?: string;
  bgColor?: string;
  className?: string;
  extra?: string;
  children?: ReactNode;
}

const CarTile: React.FC<CarTileProps> = ({
  title,
  value,
  icon,
  iconColor = 'text-brand-500',
  bgColor = 'bg-lightPrimary',
  className = '',
  extra = '',
  children
}) => {
  return (
    <Card 
      extra={`flex flex-col ${value ? 'justify-between' : 'justify-center'} p-4 ${className} ${extra}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-white">
          {title}
        </p>
        {icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bgColor}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        )}
      </div>
      
      {value && (
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {value}
        </h4>
      )}
      
      {children && <div className="mt-2">{children}</div>}
    </Card>
  );
};

export default CarTile; 