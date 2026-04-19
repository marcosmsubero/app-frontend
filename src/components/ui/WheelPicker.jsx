import { useEffect, useRef } from "react";
import "../../styles/wheel-picker.css";

/**
 * iPhone-style wheel picker. Scroll-snaps items into a central highlight
 * band. Touch / trackpad / wheel gestures stay contained inside the picker
 * to prevent page-scroll bleed-through on iOS Safari and trackpad-heavy
 * desktop browsers.
 *
 * Props:
 * - items: readonly array of string|number options
 * - value: the currently selected item (must equal one of `items`)
 * - onChange: (nextValue) => void, fires when the centered item changes
 * - label?: optional label rendered above the wheel
 * - unit?: optional suffix rendered after each item (e.g. "km")
 * - itemHeight?: pixel height per item (default 40)
 * - visibleItems?: odd number of visible rows (default 3)
 */
export default function WheelPicker({
  items,
  value,
  onChange,
  label,
  unit = "",
  itemHeight = 40,
  visibleItems = 3,
}) {
  const containerRef = useRef(null);
  const currentIndex = items.indexOf(value);

  useEffect(() => {
    if (containerRef.current && currentIndex >= 0) {
      containerRef.current.scrollTop = currentIndex * itemHeight;
    }
  }, [currentIndex, itemHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheelNative = (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop += e.deltaY;
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheelNative);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchMoveNative = (e) => {
      e.stopPropagation();
    };

    el.addEventListener("touchmove", onTouchMoveNative, { passive: true });
    return () => {
      el.removeEventListener("touchmove", onTouchMoveNative);
    };
  }, []);

  function handleScroll() {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const idx = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
  }

  const highlightOffset = Math.floor(visibleItems / 2) * itemHeight;
  const padding = highlightOffset;

  return (
    <div className="wheelPicker">
      {label && <div className="wheelPicker__label">{label}</div>}
      <div
        className="wheelPicker__viewport"
        style={{ height: itemHeight * visibleItems }}
      >
        <div
          className="wheelPicker__highlight"
          style={{ top: highlightOffset, height: itemHeight }}
        />
        <div
          ref={containerRef}
          className="wheelPicker__scroll"
          onScroll={handleScroll}
          style={{ paddingTop: padding, paddingBottom: padding }}
        >
          {items.map((item) => {
            const isActive = item === value;
            return (
              <div
                key={item}
                className={`wheelPicker__item${isActive ? " is-active" : ""}`}
                style={{ height: itemHeight }}
                onClick={() => {
                  onChange(item);
                  if (containerRef.current) {
                    const idx = items.indexOf(item);
                    containerRef.current.scrollTo({
                      top: idx * itemHeight,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                {item}
                {unit}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
