declare module 'virtual:dogfood-data' {
  /** Manifest: metadata only (no profile data) */
  const data: Record<string, { latestDate: string; runSummary: any | null }>;
  export default data;
  /** Per-run lazy loaders: { "runKey": () => Promise<{ default: string }> } */
  export const runLoaders: Record<string, () => Promise<{ default: string }>>;
  /** Per-run signal lazy loaders */
  export const signalLoaders: Record<string, () => Promise<{ default: string }>>;
}

declare module 'virtual:dogfood-run/*' {
  /** Raw JSONL string from layer4_postprocessing.jsonl (may be empty) */
  const data: string;
  export default data;
}

declare module 'virtual:dogfood-signal-run/*' {
  /** Raw JSONL string: all layer0_signal.jsonl from all dates of this run concatenated */
  const data: string;
  export default data;
}

declare module 'virtual:dogfood-intermediate-manifest' {
  /** { [runKey]: string[] } — dates per run */
  const manifest: Record<string, string[]>;
  export default manifest;
  /** Per-date lazy loaders (essential layers): { "runKey/date": () => Promise<{ default: Record<string, string> }> } */
  export const loaders: Record<string, () => Promise<{ default: Record<string, string> }>>;
  /** Per-date raw-file loaders (ALL .jsonl): { "runKey/date": () => Promise<{ default: Record<string, string> }> } */
  export const rawLoaders: Record<string, () => Promise<{ default: Record<string, string> }>>;
}

declare module 'virtual:dogfood-intermediate-date/*' {
  /** { [layerName]: jsonlString, prev_layer2_postmerge?: jsonlString } */
  const data: Record<string, string>;
  export default data;
}

declare module 'virtual:dogfood-intermediate-raw/*' {
  /** ALL .jsonl files from the date folder: { [layerName]: jsonlString } */
  const data: Record<string, string>;
  export default data;
}
