// A drawn (not screenshotted) small-business website inside a browser frame,
// used to show what a Growth Hub Sites template looks like. Decorative.

export default function BrowserMock({
  address = 'yourbusiness.com.au',
  name = 'Your business',
  headline = 'Fresh, local and open from 7am',
  action = 'Book a table',
}: {
  address?: string;
  name?: string;
  headline?: string;
  action?: string;
}) {
  return (
    <div className="browser-mock" aria-hidden="true">
      <div className="browser-bar">
        <i />
        <i />
        <i />
        <span>{address}</span>
      </div>
      <div className="browser-screen">
        <div className="mock-nav">
          <b>{name}</b>
          <span>Menu · Hours · Contact</span>
        </div>
        <div className="mock-hero">
          <span className="h">{headline}</span>
          <span className="b">{action}</span>
        </div>
        <div className="mock-rows">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
