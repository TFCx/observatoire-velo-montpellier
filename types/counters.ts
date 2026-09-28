export type Count = {
  month: string;
  count: number;
}

export type Counter = {
  name: string;
  description: string;
  arrondissement: string;
  idPdc: string;
  coordinates: number[];
  lines: number[];
  counts: Count[];
}

// Forme d'un compteur lu depuis le contenu ; ParsedContent n'existe plus dans @nuxt/content v3.
export interface CounterParsedContent {
  path: string;
  name: string;
  description: string;
  arrondissement: string;
  idPdc: string;
  coordinates: number[];
  cyclopolisId?: string;
  lines?: number[];
  counts: Count[];
}
