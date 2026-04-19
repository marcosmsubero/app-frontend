import ngeohash from "ngeohash";
import { PREFERENCE_MODES } from "../../lib/preferencesContract";
import "../../styles/create-event.css"; // reuse .floatingField styles
import "./PreferenceField.css";

/**
 * Reusable preference editor. Renders a value selector appropriate to the
 * field's `kind` plus a three-state mode selector (off / soft / hard).
 *
 * Visual language matches the CreateEvent form: floating-label inputs +
 * native <select> (which invokes the iOS wheel picker).
 *
 * Props:
 *   field: { id, label, kind, options?, max? }
 *   entry: { value, mode } | undefined
 *   onChange: (entry | null) => void — pass null to reset (off)
 *   disabled?: boolean
 */
export default function PreferenceField({ field, entry, onChange, disabled }) {
  const mode = entry?.mode || "off";
  const value = entry?.value;

  function setMode(nextMode) {
    if (disabled) return;
    if (nextMode === "off") {
      onChange(null);
      return;
    }
    onChange({ value: value ?? defaultValueFor(field), mode: nextMode });
  }

  function setValue(nextValue) {
    if (disabled) return;
    // If user picks a value while mode is off, auto-activate soft so the
    // choice becomes meaningful (otherwise the value would be stored but
    // ignored by matching).
    const nextMode = mode === "off" ? "soft" : mode;
    onChange({ value: nextValue, mode: nextMode });
  }

  const isSet = mode !== "off";
  const isHard = mode === "hard";

  return (
    <div
      className={`prefRow${isSet ? " is-set" : ""}${isHard ? " is-hard" : ""}`}
    >
      {renderValueEditor(field, value, setValue, disabled)}

      <div className="prefRow__modeBar" role="radiogroup" aria-label="Modo">
        {PREFERENCE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            className={
              `prefRow__mode prefRow__mode--${m}` +
              (mode === m ? " is-active" : "")
            }
            onClick={() => setMode(m)}
            disabled={disabled}
          >
            {labelForMode(m)}
          </button>
        ))}
      </div>
    </div>
  );
}

function labelForMode(m) {
  if (m === "off") return "Opcional";
  if (m === "soft") return "Prefiero";
  return "Imprescindible";
}

function defaultValueFor(field) {
  switch (field.kind) {
    case "bool":
      return true;
    case "multi_enum":
      return [];
    case "enum":
    case "enum_int":
      return field.options?.[0]?.value ?? null;
    case "pace_range":
    case "km_range":
      return defaultRangeFor(field);
    case "zones":
      return [];
    default:
      return null;
  }
}

function defaultRangeFor(field) {
  const first = field.options?.[0]?.value;
  const last = field.options?.[field.options.length - 1]?.value;
  if (field.kind === "pace_range") {
    return { min_sec: first, max_sec: last };
  }
  if (field.kind === "km_range") {
    return { min_km: first, max_km: last };
  }
  return {};
}

function renderValueEditor(field, value, setValue, disabled) {
  const inputId = `pref-${field.id}`;

  switch (field.kind) {
    case "enum":
    case "enum_int": {
      const current = value ?? "";
      return (
        <div className="floatingField floatingField--always-floated floatingField--select">
          <select
            id={inputId}
            className="floatingField__input"
            value={current}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") return;
              const parsed = field.kind === "enum_int" ? Number(raw) : raw;
              setValue(parsed);
            }}
            disabled={disabled}
          >
            <option value="">—</option>
            {field.options.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
          <label className="floatingField__label" htmlFor={inputId}>
            {field.label}
          </label>
        </div>
      );
    }

    case "multi_enum": {
      const arr = Array.isArray(value) ? value : [];
      const toggle = (v) => {
        const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
        setValue(next);
      };
      return (
        <div className="prefRow__chipGroup">
          <div className="prefRow__chipLabel">{field.label}</div>
          <div className="prefRow__chips">
            {field.options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                className={
                  "prefRow__chip" + (arr.includes(opt.value) ? " is-active" : "")
                }
                onClick={() => toggle(opt.value)}
                disabled={disabled}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "bool":
      return (
        <div className="prefRow__switchRow">
          <span className="prefRow__switchLabel">{field.label}</span>
          <label className="prefRow__switch">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => setValue(e.target.checked)}
              disabled={disabled}
            />
            <span className="prefRow__switchTrack" />
          </label>
        </div>
      );

    case "pace_range":
    case "km_range": {
      const isPace = field.kind === "pace_range";
      const minKey = isPace ? "min_sec" : "min_km";
      const maxKey = isPace ? "max_sec" : "max_km";
      const min = value?.[minKey] ?? field.options[0].value;
      const max = value?.[maxKey] ?? field.options[field.options.length - 1].value;
      const minId = `${inputId}-min`;
      const maxId = `${inputId}-max`;
      return (
        <div className="prefRow__rangeGroup">
          <div className="prefRow__chipLabel">{field.label}</div>
          <div className="createEventForm__grid">
            <div className="floatingField floatingField--always-floated floatingField--select">
              <select
                id={minId}
                className="floatingField__input"
                value={String(min)}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setValue({ [minKey]: next, [maxKey]: Math.max(max, next) });
                }}
                disabled={disabled}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label className="floatingField__label" htmlFor={minId}>
                Mínimo
              </label>
            </div>
            <div className="floatingField floatingField--always-floated floatingField--select">
              <select
                id={maxId}
                className="floatingField__input"
                value={String(max)}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setValue({ [minKey]: Math.min(min, next), [maxKey]: next });
                }}
                disabled={disabled}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label className="floatingField__label" htmlFor={maxId}>
                Máximo
              </label>
            </div>
          </div>
        </div>
      );
    }

    case "zones":
      return (
        <div className="prefRow__chipGroup">
          <div className="prefRow__chipLabel">{field.label}</div>
          <ZonesEditor
            zones={value}
            max={field.max}
            onChange={setValue}
            disabled={disabled}
          />
        </div>
      );

    default:
      return null;
  }
}

function ZonesEditor({ zones, max, onChange, disabled }) {
  const list = Array.isArray(zones) ? zones : [];

  function addZone() {
    if (list.length >= max) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const geohash = ngeohash.encode(
        pos.coords.latitude,
        pos.coords.longitude,
        6,
      );
      const name =
        window.prompt("Nombre de la zona (ej. Chamberí)", "") || "Zona";
      onChange([...list, { geohash, name: name.slice(0, 80) }]);
    });
  }

  function removeZone(i) {
    onChange(list.filter((_, idx) => idx !== i));
  }

  return (
    <div className="prefRow__zones">
      {list.map((z, i) => (
        <div className="prefRow__zonePill" key={`${z.geohash}-${i}`}>
          <span>{z.name}</span>
          <button
            type="button"
            className="prefRow__zoneRemove"
            onClick={() => removeZone(i)}
            disabled={disabled}
            aria-label={`Quitar ${z.name}`}
          >
            ×
          </button>
        </div>
      ))}
      {list.length < max && (
        <button
          type="button"
          className="prefRow__chip"
          onClick={addZone}
          disabled={disabled}
        >
          + Añadir zona
        </button>
      )}
    </div>
  );
}
