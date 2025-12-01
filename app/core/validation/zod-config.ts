import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
import i18next from "i18next";
import translation from "zod-i18n-map/locales/pt/zod.json";

// Initialize i18next with the Portuguese translation
i18next.init({
  lng: "pt",
  resources: {
    pt: { zod: translation },
  },
});

// Set the global error map
z.config({ localeError: zodI18nMap });

export { z };
