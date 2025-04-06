declare module 'lucide-react' {
  import React from 'react';
  
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    stroke?: string | number;
  }
  
  export type Icon = React.FC<IconProps>;
  
  export const ArrowLeft: Icon;
  export const BarChart2: Icon;
  export const Users: Icon;
  export const TrendingUp: Icon;
  export const UserPlus: Icon;
  export const Smile: Icon;
  export const Zap: Icon;
  export const Filter: Icon;
  export const Search: Icon;
  export const AlertTriangle: Icon;
  export const Network: Icon;
  export const CircleOff: Icon;
  export const CircleDot: Icon;
  export const GitBranchPlus: Icon;
  export const Palette: Icon;
  export const Maximize: Icon;
  export const ChevronDown: Icon;
  export const ChevronRight: Icon;
  export const ChevronLeft: Icon;
  export const MoreHorizontal: Icon;
  export const Check: Icon;
  export const Circle: Icon;
} 