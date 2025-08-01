<script lang="ts">
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { seoData } from '$lib/config/seoConfig';

  type SeoEntry = {
    title: string;
    description: string;
    keywords: string;
    ogTitle?: string;
    ogDescription?: string;
    structuredData: object;
  };

  const route = get(page).url.pathname;
  const typedSeoData: Record<string, SeoEntry> = seoData;
  const seo = typedSeoData[route] ?? typedSeoData['/'];

  const title = seo.title;
  const description = seo.description;
  const keywords = seo.keywords;
  const ogTitle = seo.ogTitle ?? title;
  const ogDescription = seo.ogDescription ?? description;
  const structuredData = seo.structuredData;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={ogDescription} />
  <link rel="canonical" href="https://funkfragen.de{route}" />
  <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
</svelte:head>