import ngeohash from "ngeohash";
import { PREFERENCE_MODES } from "../../lib/preferencesContract";
import "./PreferenceField.css";

/**
 * Reusable preference editor. Given a field definition + current entry,
 * renders a value selector appropriate to the kind + the off/soft/hard
 * mode selector.
 *
 * Props:
 *   field: { id, label, kind, options?, bounds?, max? }
 *   entry: { value, mode } | undefined
 *   onChange: (entry | null) => void — pass null to reset (off)
 *   disabled?: boolean
 */
export default function PreferenceField({ field, entry, onChange, disabled }) {
  const mode = entry?.mode || "off";
  const value = entry?.value;
  const isSet = mode !== "off";
  const isHard = mode === "hard";

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

  return (
    <div
      className={`prefField${isSet ? " is-set" : ""}${isHard ? " is-hard" : ""}`}
    >
      <div className="prefField__label">{field.label}</div>

      <div className="prefField__value">
        {renderValueEditor(field, value, setValue, disabled)}
      </div>

      <div className="prefField__modeBar" role="radiogroup" aria-label="Modo">
        {PREFERENCE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            className={
              `prefField__mode prefField__mode--${m}` +
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
  if (m === "off") return "No me importa";
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
      return {};
    case "zones":
      return [];
    default:
      return null;
  }
}

function renderValueEditor(field, value, setValue, disabled) {
  switch (field.kind) {
    case "enum":
    case "enum_int":
      return (
        <div className="prefField__chips">
          {field.options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className={
                "prefField__chip" + (value === opt.value ? " is-active" : "")
              }
              onClick={() => setValue(opt.value)}
              disabled={disabled}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case "multi_enum": {
      const arr = Array.isArray(value) ? value : [];
      const toggle = (v) => {
        const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
        setValue(next);
      };
      return (
        <div className="prefField__chips">
          {field.options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className={
                "prefField__chip" + (arr.includes(opt.value) ? " is-active" : "")
              }
              onClick={() => toggle(opt.value)}
              disabled={disabled}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    case "bool":
      return (
        <div className="prefField__chips">
          <button
            type="button"
            className={"prefField__chip" + (value === false ? " is-active" : "")}
            onClick={() => setValue(false)}
            disabled={disabled}
          >
            {field.falseLabel || "No"}
          </button>
          <button
            type="button"
            className={"prefField__chip" + (value === true ? " is-active" : "")}
            onClick={() => setValue(true)}
            disabled={disabled}
          >
            {field.trueLabel || "Sí"}
          </button>
        </div>
      );

    case "pace_range": {
      const min = value?.min_sec ?? field.bounds.minSec;
      const max = value?.max_sec ?? field.bounds.maxSec;
      const toLabel = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
      };
      return (
        <div className="prefField__rangeRow">
          <input
            type="range"
            min={field.bounds.minSec}
            max={field.bounds.maxSec}
            step={15}
            value={min}
            onChange={(e) =>
              setValue({
                min_sec: Number(e.target.value),
                max_sec: Math.max(max, Number(e.target.value)),
              })
            }
            disabled={disabled}
          />
          <span className="prefField__rangeLabel">
            {toLabel(min)}–{toLabel(max)}
          </span>
          <input
            type="range"
            min={field.bounds.minSec}
            max={field.bounds.maxSec}
            step={15}
            value={max}
            onChange={(e) =>
              setValue({
                min_sec: Math.min(min, Number(e.target.value)),
                max_sec: Number(e.target.value),
              })
            }
            disabled={disabled}
          />
        </div>
      );
    }

    case "km_range": {
      const min = value?.min_km ?? field.bounds.minKm;
      const max = value?.max_km ?? field.bounds.maxKm;
      return (
        <div className="prefField__rangeRow">
          <input
            type="range"
            min={field.bounds.minKm}
            max={field.bounds.maxKm}
            step={1}
            value={min}
            onChange={(e) =>
              setValue({
                min_km: Number(e.target.value),
                max_km: Math.max(max, Number(e.target.value)),
              })
            }
            disabled={disabled}
          />
          <span className="prefField__rangeLabel">
            {min}–{max} km
          </span>
          <input
            type="range"
            min={field.bounds.minKm}
            max={field.bounds.maxKm}
            step={1}
            value={max}
            onChange={(e) =>
              setValue({
                min_km: Math.min(min, Number(e.target.value)),
                max_km: Number(e.target.value),
              })
            }
            disabled={disabled}
          />
        </div>
      );
    }

    case "zones":
      return (
        <ZonesEditor
          zones={value}
          max={field.max}
          onChange={setValue}
          disabled={disabled}
        />
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
      const name = window.prompt("Nombre de la zona (ej. Chamberí)", "") || "Zona";
      onChange([...list, { geohash, name: name.slice(0, 80) }]);
    });
  }

  function removeZone(i) {
    const next = list.filter((_, idx) => idx !== i);
    onChange(next);
  }

  return (
    <div className="prefField__zones">
      {list.map((z, i) => (
        <div className="prefField__zonePill" key={`${z.geohash}-${i}`}>
          <span>{z.name}</span>
          <button
            type="button"
            className="prefField__zoneRemove"
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
          className="prefField__chip"
          onClick={addZone}
          disabled={disabled}
        >
          + Añadir zona (usa mi ubicación)
        </button>
      )}
    </div>
  );
}
