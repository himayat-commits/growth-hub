import Image from "next/image";
import Link from "next/link";

function Underline({ color = "#E3F29C" }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 320 22"
      width="100%"
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      style={{ position: "absolute", left: 0, bottom: "-10px", width: "100%" }}
    >
      <path d="M6 14 C 60 6, 120 4, 180 8 C 230 11, 280 9, 314 13" />
      <path d="M12 18 C 80 15, 160 13, 300 17" opacity="0.5" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap">
        <div className="hero-eyebrow">
          <span className="dot" />
          A Social Traders Verified Enterprise
        </div>

        <h1 className="hero-h1">
          Your business deserves to&nbsp;
          <span className="grow">
            grow
            <Underline />
          </span>
          .
        </h1>

        <div className="hero-handnote">
          <span className="txt handscript">Grow local. Grow together.</span>
        </div>

        <p className="hero-sub">
          We make that happen. AI-powered digital marketing with real, local
          support, so you grow confidently — knowing every subscription fuels
          employment pathways in our community.
        </p>

        <div className="hero-ctas">
          <Link className="btn btn-primary" href="#packages">
            View Packages
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 7h8M7 3l4 4-4 4" />
            </svg>
          </Link>
          <Link className="btn btn-secondary" href="#how">
            Learn More
          </Link>
        </div>

        <div className="hero-chips">
          <span className="chip"><span className="chip-dot" /> 30+ local businesses supported</span>
          <span className="chip"><span className="chip-dot" /> Community included</span>
          <span className="chip"><span className="chip-dot" /> Canberra-based support</span>
        </div>
      </div>

      <div className="hero-art" aria-hidden="true">
        <Image
          src="/images/himayat-logo.png"
          alt=""
          width={520}
          height={520}
          style={{
            objectFit: "contain",
            filter: "opacity(0.14)",
            width: "100%",
            height: "auto",
          }}
        />
      </div>
    </section>
  );
}
