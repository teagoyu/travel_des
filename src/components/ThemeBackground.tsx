import Image from "next/image";
import type { ThemeVariant } from "@/lib/theme";
import { getTravelThemeTokens, type TravelTheme } from "@/lib/theme";

type Props = {
  theme: TravelTheme;
  variant?: ThemeVariant;
};

/** Decorative-only layer. It never owns content or pointer events. */
export default function ThemeBackground({ theme, variant = "home" }: Props) {
  const tokens = getTravelThemeTokens(theme);
  return (
    <div
      className={`theme-background theme-background--${theme} theme-background--${variant}`}
      aria-hidden="true"
      style={
        {
          "--theme-bg": tokens.background,
          "--theme-panel": tokens.panel,
          "--theme-accent": tokens.accent,
          "--theme-secondary": tokens.secondary,
          "--theme-ink": tokens.ink,
        } as React.CSSProperties
      }
    >
      <span className="theme-background__sun" />
      <span className="theme-background__cloud theme-background__cloud--one" />
      <span className="theme-background__cloud theme-background__cloud--two" />
      <span className="theme-background__route" />
      <span className="theme-background__sticker theme-background__sticker--one">✦</span>
      <span className="theme-background__sticker theme-background__sticker--two">✦</span>
      <Image priority className="theme-background__character" src={`/themes/${theme}/character.svg`} width={300} height={420} sizes="150px" alt="" />
      <div className="theme-background__traveler">
        <span className="theme-background__traveler-hat" />
        <span className="theme-background__traveler-head" />
        <span className="theme-background__traveler-body" />
        <span className="theme-background__traveler-bag" />
      </div>
      <span className="theme-background__label">{tokens.character}</span>
    </div>
  );
}
