declare module 'virtual:dogfood-data' {
  const data: Record<string, { latestDate: string; data: string; runSummary: any | null }>;
  export default data;
}

declare module 'virtual:dogfood-signal-data' {
  const data: Record<string, { dates: string[]; data: string }>;
  export default data;
}

declare module 'virtual:dogfood-intermediate-manifest' {
  /** { [runKey]: string[] } — dates per run */
  const manifest: Record<string, string[]>;
  export default manifest;
  /** Per-date lazy loaders: { "runKey/date": () => Promise<{ default: Record<string, string> }> } */
  export const loaders: Record<string, () => Promise<{ default: Record<string, string> }>>;
}

declare module 'virtual:dogfood-intermediate-date/*' {
  /** { [layerName]: jsonlString, prev_layer2_postmerge?: jsonlString } */
  const data: Record<string, string>;
  export default data;
}
