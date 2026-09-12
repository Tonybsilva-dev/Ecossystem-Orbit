export const generateOrganizationSchema = (name: string, url: string, logo?: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name,
  url,
  logo,
});

export const generateWebSiteSchema = (name: string, url: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name,
  url,
});

export const generateBreadcrumbSchema = (items: { name: string; item: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.item,
  })),
});
