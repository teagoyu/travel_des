"use client";

import { getTravelTheme, TRAVEL_THEME_TOKENS, TRAVEL_THEMES, type TravelTheme } from "@/lib/theme";

type Props = { value: TravelTheme; onChange: (theme: TravelTheme) => void };

export default function TravelThemePicker({ value, onChange }: Props) {
  return (
    <div className="theme-picker" aria-label="选择旅行主题">
      <span className="theme-picker__label">旅行手账风格</span>
      <div className="theme-picker__options" role="radiogroup" aria-label="旅行主题">
        {TRAVEL_THEMES.map((theme) => {
          const tokens = TRAVEL_THEME_TOKENS[theme];
          return (
            <button
              key={theme}
              type="button"
              role="radio"
              aria-checked={value === theme}
              className={`theme-picker__option ${value === theme ? "is-selected" : ""}`}
              style={{ "--picker-accent": tokens.accent, "--picker-secondary": tokens.secondary } as React.CSSProperties}
              onClick={() => onChange(getTravelTheme(theme))}
            >
              <span className="theme-picker__dot" aria-hidden="true" />
              <span>
                <strong>{tokens.label}</strong>
                <small>{tokens.motif}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
