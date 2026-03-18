declare module 'virtual:dogfood-data' {
  const data: Record<string, { latestDate: string; data: string; runSummary: any | null }>;
  export default data;
}

declare module 'virtual:dogfood-signal-data' {
  const data: Record<string, { dates: string[]; data: string }>;
  export default data;
}
