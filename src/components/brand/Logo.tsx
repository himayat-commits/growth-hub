import Image from "next/image";

// The one Growth Hub lock-up: mark + "Growth Hub" + "by Himayat". Used by the
// navbar, footer and global 404, so a change of mark (see "Logo and the 'by
// Himayat' endorsement" in docs/BRAND.md) is a change to this file only.
// The mark is decorative: the wordmark beside it carries the name, so screen
// readers hear "Growth Hub by Himayat" once.

const MARK_SRC = "/images/himayat-logo.png";

// The PNG ships as a teal silhouette; on dark surfaces this maps it to lime.
const LIGHT_MARK_FILTER =
  "brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(10deg) brightness(1.08)";

type Placement = "nav" | "footer";

export function Logo({
  placement = "nav",
  eager = false,
}: {
  placement?: Placement;
  eager?: boolean;
}) {
  if (placement === "footer") {
    return (
      <div className="foot-brand">
        <Image
          src={MARK_SRC}
          alt=""
          width={36}
          height={36}
          style={{ objectFit: "contain", filter: LIGHT_MARK_FILTER }}
        />
        <div className="foot-brand-text">
          <span className="name">Growth Hub</span>
          <span className="sub">by Himayat</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Image
        src={MARK_SRC}
        alt=""
        width={30}
        height={30}
        loading={eager ? "eager" : undefined}
        style={{ objectFit: "contain" }}
      />
      <span className="wordmark">
        Growth Hub <span className="logo-sub">by Himayat</span>
      </span>
    </>
  );
}
