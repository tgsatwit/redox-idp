import { IconType } from 'react-icons';
import { SVGAttributes } from 'react';

declare module 'react-icons/fi' {
  export interface IconBaseProps extends SVGAttributes<SVGElement> {
    size?: string | number;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
  }
  
  export const FiPlus: IconType;
  export const FiEdit2: IconType;
  export const FiTrash2: IconType;
  export const FiSettings: IconType;
} 