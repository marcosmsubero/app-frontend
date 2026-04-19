/**
 * Canonical shape + catalog for user matching preferences.
 *
 * Mirrors the Pydantic schema at
 * app-backend-main/app/schemas/user_preferences.py. Field ids, values,
 * and modes must stay in sync with the backend contract.
 *
 * Each field is stored on the server as { value, mode } under its id.
 * Mode is one of "off" | "soft" | "hard"; see the spec for semantics:
 * docs/superpowers/specs/2026-04-19-explorar-matcheo-mutuo-design.md
 */

export const PREFERENCE_MODES = ["off", "soft", "hard"];

export const DEFAULT_PREFERENCES = {};

/**
 * Field catalog — drives the settings UI and the onboarding step.
 * Flat array so iteration order is stable. The `section` key is used
 * by the UI to group fields visually.
 */
export const PREFERENCE_FIELDS = [
  // Safety (3)
  {
    id: "gender_match",
    section: "safety",
    label: "Género con quien matcheo",
    kind: "multi_enum",
    options: [
      { value: "women", label: "Mujeres" },
      { value: "men", label: "Hombres" },
      { value: "nonbinary", label: "No-binario" },
    ],
  },
  {
    id: "require_verified",
    section: "safety",
    label: "Verificación requerida",
    kind: "bool",
    trueLabel: "Requerir email verificado",
    falseLabel: "Cualquiera",
  },
  {
    id: "min_mutual_contacts",
    section: "safety",
    label: "Contactos en común mínimos",
    kind: "enum_int",
    options: [
      { value: 0, label: "0" },
      { value: 1, label: "1" },
      { value: 3, label: "3" },
    ],
  },

  // Running (8)
  {
    id: "pace_range",
    section: "running",
    label: "Ritmo habitual (min/km)",
    kind: "pace_range",
    bounds: { minSec: 180, maxSec: 540 },
  },
  {
    id: "distance_range",
    section: "running",
    label: "Distancia típica (km)",
    kind: "km_range",
    bounds: { minKm: 1, maxKm: 50 },
  },
  {
    id: "duration",
    section: "running",
    label: "Duración típica",
    kind: "enum",
    options: [
      { value: "15_30", label: "15–30 min" },
      { value: "30_60", label: "30–60 min" },
      { value: "60_90", label: "60–90 min" },
      { value: "90_plus", label: "90+ min" },
    ],
  },
  {
    id: "level",
    section: "running",
    label: "Nivel",
    kind: "enum",
    options: [
      { value: "beginner", label: "Principiante" },
      { value: "intermediate", label: "Intermedio" },
      { value: "advanced", label: "Avanzado" },
    ],
  },
  {
    id: "training_type",
    section: "running",
    label: "Tipo de entrenamiento",
    kind: "multi_enum",
    options: [
      { value: "continuous", label: "Carrera continua" },
      { value: "intervals", label: "Series" },
      { value: "long_run", label: "Long run" },
      { value: "trail", label: "Trail" },
      { value: "mixed", label: "Mixto" },
    ],
  },
  {
    id: "terrain",
    section: "running",
    label: "Terreno",
    kind: "multi_enum",
    options: [
      { value: "road", label: "Asfalto" },
      { value: "dirt", label: "Tierra" },
      { value: "mountain", label: "Montaña" },
      { value: "track", label: "Pista" },
    ],
  },
  {
    id: "frequency",
    section: "running",
    label: "Frecuencia",
    kind: "enum",
    options: [
      { value: "rare", label: "Esporádico" },
      { value: "1_2x", label: "1–2 × sem" },
      { value: "3_5x", label: "3–5 × sem" },
      { value: "daily", label: "Diario" },
    ],
  },
  {
    id: "goal",
    section: "running",
    label: "Objetivo",
    kind: "enum",
    options: [
      { value: "maintenance", label: "Mantenimiento" },
      { value: "weight_loss", label: "Pérdida de peso" },
      { value: "race_prep", label: "Preparar carrera" },
      { value: "competition", label: "Competición" },
    ],
  },

  // Logistics (3)
  {
    id: "time_slots",
    section: "logistics",
    label: "Franjas horarias",
    kind: "multi_enum",
    options: [
      { value: "morning", label: "Mañana" },
      { value: "midday", label: "Mediodía" },
      { value: "evening", label: "Tarde" },
      { value: "night", label: "Noche" },
    ],
  },
  {
    id: "habitual_zones",
    section: "logistics",
    label: "Zonas habituales",
    kind: "zones",
    max: 3,
  },
  {
    id: "max_radius_km",
    section: "logistics",
    label: "Radio máximo para quedar",
    kind: "enum_int",
    options: [
      { value: 2, label: "2 km" },
      { value: 5, label: "5 km" },
      { value: 10, label: "10 km" },
      { value: 20, label: "20 km" },
    ],
  },

  // Vibe (3)
  {
    id: "social_style",
    section: "vibe",
    label: "Estilo social",
    kind: "enum",
    options: [
      { value: "social", label: "Social (charlar)" },
      { value: "focused", label: "Focused (silencio)" },
      { value: "flexible", label: "Flexible" },
    ],
  },
  {
    id: "languages",
    section: "vibe",
    label: "Idiomas",
    kind: "multi_enum",
    options: [
      { value: "es", label: "Español" },
      { value: "en", label: "English" },
      { value: "ca", label: "Català" },
      { value: "fr", label: "Français" },
      { value: "pt", label: "Português" },
    ],
  },
  {
    id: "age_range",
    section: "vibe",
    label: "Rango de edad",
    kind: "enum",
    options: [
      { value: "plus_minus_5", label: "±5 años" },
      { value: "plus_minus_10", label: "±10 años" },
      { value: "any", label: "Cualquiera" },
    ],
  },
];

export const CORE_ONBOARDING_FIELDS = [
  "gender_match",
  "pace_range",
  "distance_range",
  "time_slots",
  "habitual_zones",
  "level",
];

const FIELD_IDS = new Set(PREFERENCE_FIELDS.map((f) => f.id));

export function normalizePreferences(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, entry] of Object.entries(raw)) {
    if (!FIELD_IDS.has(key)) continue;
    if (!entry || typeof entry !== "object") continue;
    if (!PREFERENCE_MODES.includes(entry.mode)) continue;
    out[key] = { value: entry.value, mode: entry.mode };
  }
  return out;
}

export function isPreferenceSet(entry) {
  if (!entry || typeof entry !== "object") return false;
  return entry.mode === "soft" || entry.mode === "hard";
}

export function getFieldDef(id) {
  return PREFERENCE_FIELDS.find((f) => f.id === id) || null;
}

export function fieldsBySection() {
  const sections = {};
  for (const f of PREFERENCE_FIELDS) {
    if (!sections[f.section]) sections[f.section] = [];
    sections[f.section].push(f);
  }
  return sections;
}
