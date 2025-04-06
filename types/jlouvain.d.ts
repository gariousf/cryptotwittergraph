declare module 'jlouvain' {
  export default function jLouvain(): {
    nodes: (nodes: string[]) => any;
    edges: (edges: Array<{source: string, target: string, weight?: number}>) => any;
    partition_at_level: (level: number) => Record<string, number>;
  };
} 