export type PerformanceMemory = {
  usedJSHeapSize: number;
};

export type PerformanceWithMemory = Performance & {
  memory?: PerformanceMemory;
};
