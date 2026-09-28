import { defineCollection, defineContentConfig, z } from '@nuxt/content';

// Les champs de frontmatter non déclarés ici ne sont pas accessibles directement dans les pages
// (Content v3 les range dans `meta`) : chaque champ lu par un composant doit figurer dans un schéma.

// Les features GeoJSON restent volontairement non détaillées : leur cohérence est vérifiée par
// tests/data-health.test.ts. Les faire passer dans ce schéma est une étape ultérieure (TODO.md, phase 1).
const geojsonSchema = z.object({
  type: z.string(),
  name: z.string().optional(),
  features: z.array(z.any())
});

export default defineContentConfig({
  collections: {
    voiesCyclablesPages: defineCollection({
      type: 'page',
      source: 'voies-cyclables/*.md',
      schema: z.object({
        // YAML lit "line: 1" comme un nombre et "line: A" comme un texte.
        line: z.union([z.number(), z.string()]),
        lineName: z.string(),
        lineNameShort: z.union([z.number(), z.string()]),
        from: z.string(),
        to: z.string(),
        trafic: z.string().nullable().optional(),
        cover: z.string().nullable().optional()
      })
    }),
    voiesCyclablesGeojson: defineCollection({
      type: 'data',
      source: 'voies-cyclables/*.json',
      schema: geojsonSchema
    }),
    limits: defineCollection({
      type: 'data',
      source: 'limits/*.json',
      schema: geojsonSchema
    }),
    services: defineCollection({
      type: 'data',
      source: 'services/*.json',
      schema: geojsonSchema
    }),
    news: defineCollection({
      type: 'page',
      source: 'news/*.md',
      schema: z.object({
        date: z.string(),
        newsBannerText: z.string()
      })
    }),
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        imageUrl: z.string()
      })
    }),
    sitesPartenaires: defineCollection({
      type: 'page',
      source: 'sites-partenaires/*.md',
      schema: z.object({
        imageUrl: z.string(),
        city: z.string(),
        link: z.string(),
        index: z.number()
      })
    })
  }
});
