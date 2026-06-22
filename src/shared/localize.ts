// Lightweight card-facing localization. English is the fallback for any
// unsupported language. The editor stays English-only for now.

const strings: Record<string, Record<string, string>> = {
  en: {
    now: "Now",
    heating: "Heating",
    unavailable: "Entity unavailable",
    valve: "Valve",
    battery: "Battery",
    window: "Window",
    open: "Open",
    closed: "Closed",
    home: "Home",
    away: "Away",
  },
  de: {
    now: "Aktuell",
    heating: "Heizt",
    unavailable: "Entität nicht verfügbar",
    valve: "Ventil",
    battery: "Batterie",
    window: "Fenster",
    open: "Offen",
    closed: "Geschlossen",
    home: "Zuhause",
    away: "Abwesend",
  },
};

export function localize(lang: string | undefined, key: string): string {
  const code = (lang ?? "en").substring(0, 2).toLowerCase();
  return strings[code]?.[key] ?? strings.en[key] ?? key;
}
