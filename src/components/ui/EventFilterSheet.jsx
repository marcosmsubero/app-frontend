import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

/* Shared chip-preset filter sheet — used by both the Events calendar
   and the Profile agenda so filtering behaves identically everywhere.
   Presets cover how runners actually think about these filters
   ("medio maratón", "por la mañana"); a single tap commits the value. */

export const TIME_PRESETS = [
  { id: "any", label: "Cualquiera", range: [0, 24] },
  { id: "morning", label: "Mañana", range: [6, 12] },
  { id: "midday", label: "Mediodía", range: [12, 16] },
  { id: "evening", label: "Tarde", range: [16, 20] },
  { id: "night", label: "Noche", range: [20, 24] },
];

export const DISTANCE_PRESETS = [
  { id: "any", label: "Cualquiera", range: [0, 100] },
  { id: "5k", label: "5 km", range: [0, 5] },
  { id: "10k", label: "10 km", range: [5, 10] },
  { id: "half", label: "Medio M.", range: [10, 21] },
  { id: "marathon", label: "Maratón", range: [21, 42] },
  { id: "ultra", label: "Ultra", range: [42, 100] },
];

export const RADIUS_PRESETS = [
  { id: "any", label: "Sin límite", value: 0 },
  { id: "5", label: "5 km", value: 5 },
  { id: "10", label: "10 km", value: 10 },
  { id: "25", label: "25 km", value: 25 },
  { id: "50", label: "50 km", value: 50 },
];

export const DEFAULT_FILTER_STATE = {
  timeRange: [0, 24],
  kmRange: [0, 100],
  locationText: "",
  radiusKm: 0,
};

export function hasActiveFilters(f) {
  if (!f) return false;
  return (
    f.timeRange?.[0] !== 0 ||
    f.timeRange?.[1] !== 24 ||
    f.kmRange?.[0] !== 0 ||
    f.kmRange?.[1] !== 100 ||
    (f.radiusKm ?? 0) !== 0 ||
    (f.locationText || "").trim() !== ""
  );
}

function rangesEqual(a, b) {
  return a?.[0] === b?.[0] && a?.[1] === b?.[1];
}

export default function EventFilterSheet({ open, onClose, filters, onApply }) {
  const [timeRange, setTimeRange] = useState(filters.timeRange || DEFAULT_FILTER_STATE.timeRange);
  const [kmRange, setKmRange] = useState(filters.kmRange || DEFAULT_FILTER_STATE.kmRange);
  const [locationText, setLocationText] = useState(filters.locationText || "");
  const [radiusKm, setRadiusKm] = useState(filters.radiusKm ?? DEFAULT_FILTER_STATE.radiusKm);

  useEffect(() => {
    if (open) {
      setTimeRange(filters.timeRange || DEFAULT_FILTER_STATE.timeRange);
      setKmRange(filters.kmRange || DEFAULT_FILTER_STATE.kmRange);
      setLocationText(filters.locationText || "");
      setRadiusKm(filters.radiusKm ?? DEFAULT_FILTER_STATE.radiusKm);
    }
  }, [open, filters]);

  function handleApply() {
    onApply({ timeRange, kmRange, locationText, radiusKm });
    onClose();
  }

  function handleReset() {
    onApply({ ...DEFAULT_FILTER_STATE });
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filtros"
      ariaLabel="Filtros"
      className="eventFilterSheet"
      footer={
        <div className="filterPopup__footer">
          <button
            type="button"
            className="app-button app-button--ghost app-button--sm filterPopup__resetBtn"
            onClick={handleReset}
          >
            Limpiar
          </button>
          <button
            type="button"
            className="app-button app-button--primary app-button--sm filterPopup__applyBtn"
            onClick={handleApply}
          >
            Aplicar
          </button>
        </div>
      }
    >
      <div className="filterPopup__body">
        <div className="filterPopup__group">
          <span className="filterPopup__label">Horario</span>
          <div className="filterPopup__chips" role="radiogroup" aria-label="Horario">
            {TIME_PRESETS.map((p) => {
              const active = rangesEqual(timeRange, p.range);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`filterPopup__chip${active ? " is-active" : ""}`}
                  onClick={() => setTimeRange(p.range)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filterPopup__group">
          <span className="filterPopup__label">Distancia</span>
          <div className="filterPopup__chips" role="radiogroup" aria-label="Distancia">
            {DISTANCE_PRESETS.map((p) => {
              const active = rangesEqual(kmRange, p.range);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`filterPopup__chip${active ? " is-active" : ""}`}
                  onClick={() => setKmRange(p.range)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filterPopup__group">
          <span className="filterPopup__label">Ubicación</span>
          <input
            type="text"
            className="filterPopup__textInput"
            placeholder="Ciudad o lugar"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="filterPopup__chips filterPopup__chips--tight" role="radiogroup" aria-label="Radio de búsqueda">
            {RADIUS_PRESETS.map((p) => {
              const active = radiusKm === p.value;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`filterPopup__chip${active ? " is-active" : ""}`}
                  onClick={() => setRadiusKm(p.value)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
