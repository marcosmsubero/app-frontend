/**
 * A group of pill tabs. One is selected at a time. Use for top-level
 * filtering within a page (Agenda view switcher, Messages inbox filter,
 * Activity tab bar) when the number of options is 2-4.
 *
 * Props:
 *  - items: array of { value, label, count? }
 *  - value: currently selected value
 *  - onChange: (value) => void
 *  - size: 'sm' | 'md' (default 'md')
 *
 * Uses the native <button> so keyboard and screen-reader behaviour is
 * correct out of the box.
 */

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function ChipTab({
  items = [],
  value,
  onChange,
  size = "md",
  className = "",
  ariaLabel = "Filtros",
}) {
  if (!items.length) return null;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={joinClasses("ui-chiptabs", `ui-chiptabs--${size}`, className)}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            key={item.value}
            onClick={() => onChange?.(item.value)}
            className={joinClasses(
              "ui-chiptab",
              selected ? "is-selected" : ""
            )}
          >
            <span className="ui-chiptab__label">{item.label}</span>
            {typeof item.count === "number" ? (
              <span className="ui-chiptab__count">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
