import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

export const TIME_OPTIONS = [
  { value: "any", label: "Cualquiera" },
  { value: "morning", label: "Mañana" },
  { value: "midday", label: "Mediodía" },
  { value: "afternoon", label: "Tarde" },
  { value: "evening", label: "Noche" },
];

export const DISTANCE_OPTIONS = [
  { value: "any", label: "Cualquiera" },
  { value: "5k", label: "5 km" },
  { value: "10k", label: "10 km" },
  { value: "half", label: "Medio M." },
  { value: "mara", label: "Maratón" },
  { value: "ultra", label: "Ultra" },
];

function IconPin() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChipsGroup({ label, options, value, onChange }) {
  return (
    <div className="filterSheet__group">
      <div className="filterSheet__label">{label}</div>
      <div className="filterSheet__chips" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`filterSheet__chip${selected ? " is-selected" : ""}`}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ExploreFilterSheet({
  open,
  onClose,
  tab,
  appliedLocation,
  appliedTime,
  appliedDistance,
  onApply,
}) {
  const [draftLocation, setDraftLocation] = useState(appliedLocation);
  const [draftTime, setDraftTime] = useState(appliedTime);
  const [draftDistance, setDraftDistance] = useState(appliedDistance);

  // Re-hydrate the draft from applied values whenever the sheet opens.
  // Keeps "cancel by closing" behaviour: if the user tweaks chips and
  // dismisses the sheet, the next open starts from the committed state.
  useEffect(() => {
    if (open) {
      setDraftLocation(appliedLocation);
      setDraftTime(appliedTime);
      setDraftDistance(appliedDistance);
    }
  }, [open, appliedLocation, appliedTime, appliedDistance]);

  const showEventFilters = tab === "events";

  const hasDraftFilters =
    draftLocation.trim() !== "" ||
    (showEventFilters && draftTime !== "any") ||
    (showEventFilters && draftDistance !== "any");

  function handleReset() {
    setDraftLocation("");
    setDraftTime("any");
    setDraftDistance("any");
  }

  function handleApply() {
    onApply({
      location: draftLocation.trim(),
      time: showEventFilters ? draftTime : "any",
      distance: showEventFilters ? draftDistance : "any",
    });
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filtros"
      ariaLabel="Filtros de búsqueda"
      className="filterSheet"
      footer={
        <div className="filterSheet__footer">
          <button
            type="button"
            className="app-button app-button--ghost app-button--sm"
            onClick={handleReset}
            disabled={!hasDraftFilters}
          >
            Limpiar
          </button>
          <button
            type="button"
            className="app-button app-button--primary app-button--sm"
            onClick={handleApply}
          >
            Aplicar
          </button>
        </div>
      }
    >
      <div className="filterSheet__group">
        <div className="filterSheet__label">Ubicación</div>
        <label className="filterSheet__locationRow">
          <span className="filterSheet__locationIcon">
            <IconPin />
          </span>
          <input
            type="text"
            className="filterSheet__locationInput"
            placeholder="Ciudad, zona o dirección"
            value={draftLocation}
            onChange={(e) => setDraftLocation(e.target.value)}
          />
        </label>
      </div>

      {showEventFilters ? (
        <>
          <ChipsGroup
            label="Horario"
            options={TIME_OPTIONS}
            value={draftTime}
            onChange={setDraftTime}
          />
          <ChipsGroup
            label="Distancia"
            options={DISTANCE_OPTIONS}
            value={draftDistance}
            onChange={setDraftDistance}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}
