import type { TravelTheme } from "@/lib/theme";

/** 首页主视觉（创建路书第一屏） */
export default function HomeHero({ theme = "childhood" }: { theme?: TravelTheme }) {
  return (
    <div className={`theme-home-hero theme-home-hero--${theme} flex min-h-[590px] items-center overflow-hidden max-sm:min-h-[570px]`}>
      <div className="shell relative z-[1]">
        <div className="max-w-[740px] py-[88px] max-sm:py-[66px] max-sm:pb-[150px]">
          <p className="theme-home-hero__eyebrow m-0 text-xs tracking-[0.2em]">
            为下一次出发，写一份真正能走的路书
          </p>
          <h1 className="serif my-4 mb-5 mt-4 text-[clamp(46px,6vw,76px)] leading-[1.15] tracking-[0.01em] max-sm:text-[clamp(40px,12vw,46px)]">
            我的旅行地图，
            <br />
            把路走成故事。
          </h1>
          <p className="theme-home-hero__copy max-w-[500px] text-[17px] leading-[1.9] max-sm:text-sm">
            给出出发地、时间和偏好。我们把驾驶节奏、沿途风景与最佳光线，整理成一份可以随身带走的自驾路书。
          </p>
          <div className="mt-8 flex gap-9 max-sm:gap-5">
            {[
              { k: "路线", v: "每天开得动" },
              { k: "光线", v: "不错过好时刻" },
              { k: "细节", v: "旅途中用得上" },
            ].map((s) => (
              <div key={s.k} className="theme-home-hero__stat border-l pl-3.5">
                <strong className="block text-xl">{s.k}</strong>
                <span className="text-xs text-[#c3c6bc]">{s.v}</span>
              </div>
            ))}
          </div>
          <a className="btn btn-primary mt-8 no-underline" href="#plan-form">
            开始规划旅程 <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </div>
  );
}
