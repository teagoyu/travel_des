"use client";

import { useEffect, useState } from "react";
import HomeHero from "@/components/HomeHero";
import ThemeBackground from "@/components/ThemeBackground";
import TravelThemePicker from "@/components/TravelThemePicker";
import { getTravelTheme, type TravelTheme } from "@/lib/theme";

export default function TravelPlannerHero() {
  const [theme, setTheme] = useState<TravelTheme>("childhood");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = getTravelTheme(params.get("theme"));
    setTheme(initial);
    document.body.dataset.travelTheme = initial;
    return () => { delete document.body.dataset.travelTheme; };
  }, []);

  const changeTheme = (nextTheme: TravelTheme) => {
    setTheme(nextTheme);
    document.body.dataset.travelTheme = nextTheme;
    const url = new URL(window.location.href);
    url.searchParams.set("theme", nextTheme);
    window.history.replaceState({}, "", url);
  };

  return (
    <section className={`theme-home theme-home--${theme}`}>
      <ThemeBackground theme={theme} variant="home" />
      <div className="theme-home__content">
        <TravelThemePicker value={theme} onChange={changeTheme} />
        <HomeHero theme={theme} />
      </div>
    </section>
  );
}
