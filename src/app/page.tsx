import type { Metadata } from "next";
import TopBar from "@/components/TopBar";
import TravelPlannerHero from "@/components/TravelPlannerHero";
import CreateTripForm from "@/components/CreateTripForm";
import Toast from "@/components/Toast";

export const metadata: Metadata = {
  title: "山海之间 · 创建路书",
};

const STEPS = [
  { no: "01", title: "把意图说清楚", body: "选择出发地、日期、节奏与偏好，系统据此生成分日路线。" },
  { no: "02", title: "先检查，再成文", body: "路线与耗时、天气与光线、预算与风险分别核对，信息保留来源与更新时间。" },
  { no: "03", title: "带着路书出发", body: "每天的驾驶、拍摄、住宿和准备事项，都能在手机上快速查到。" },
];

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main>
        <TravelPlannerHero />
        <div className="shell relative z-[2] -mt-[72px]">
          <div id="plan-form">
            <CreateTripForm />
          </div>
          <div className="home-steps mb-20 mt-14 grid gap-7 md:grid-cols-3 max-md:mb-16 max-md:mt-10">
            {STEPS.map((step) => (
              <div key={step.no} className="home-step max-md:border-t max-md:border-line max-md:pt-4">
                <b className="home-step__number serif text-sm">{step.no}</b>
                <h3 className="home-step__title serif mb-2 mt-1.5 text-xl font-medium">{step.title}</h3>
                <p className="home-step__body m-0 text-[13px] leading-[1.8]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Toast />
    </>
  );
}
