declare module 'recharts' {
  import React from 'react';
  
  export interface BaseProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  export interface PieProps extends BaseProps {
    data?: Array<any>;
    dataKey?: string;
    nameKey?: string;
    cx?: number | string;
    cy?: number | string;
    innerRadius?: number | string;
    outerRadius?: number | string;
    label?: boolean | Function | React.ReactElement | object;
    labelLine?: boolean | object | React.ReactElement;
    paddingAngle?: number;
    startAngle?: number;
    endAngle?: number;
    minAngle?: number;
  }
  
  export interface CellProps extends BaseProps {
    key?: string | number;
    fill?: string;
    stroke?: string;
  }
  
  export interface ResponsiveContainerProps extends BaseProps {
    width?: number | string;
    height?: number | string;
    aspect?: number;
    minWidth?: number | string;
    minHeight?: number | string;
    maxHeight?: number;
    debounce?: number;
  }
  
  export interface TooltipProps extends BaseProps {
    content?: React.ReactElement | Function;
    formatter?: Function;
    labelFormatter?: Function;
    itemSorter?: Function;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    wrapperStyle?: object;
    contentStyle?: object;
    itemStyle?: object;
    labelStyle?: object;
    cursor?: boolean | object | React.ReactElement;
    position?: object;
    active?: boolean;
    coordinate?: object;
    payload?: Array<any>;
    label?: string | number;
  }
  
  export const PieChart: React.FC<BaseProps>;
  export const Pie: React.FC<PieProps>;
  export const Cell: React.FC<CellProps>;
  export const ResponsiveContainer: React.FC<ResponsiveContainerProps>;
  export const Tooltip: React.FC<TooltipProps>;
  
  export const LineChart: React.FC<any>;
  export const Line: React.FC<any>;
  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const Legend: React.FC<any>;
  export const BarChart: React.FC<any>;
  export const Bar: React.FC<any>;
  export const ScatterChart: React.FC<any>;
  export const Scatter: React.FC<any>;
  export const ZAxis: React.FC<any>;
} 