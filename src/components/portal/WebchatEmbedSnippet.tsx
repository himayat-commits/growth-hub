"use client";

import * as React from "react";

// Renders the Birdeye webchat embed <script> snippet with a one-click
// copy button. Surfaced on the Accelerate-tier post-provisioning portal
// so customers can paste it into their site head.

export default function WebchatEmbedSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="portal-webchat-embed">
      <div className="portal-webchat-embed-head">
        <span className="portal-section-label" style={{ margin: 0 }}>Webchat embed</span>
        <button type="button" onClick={copy} className="portal-webchat-copy">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="portal-webchat-snippet"><code>{snippet}</code></pre>
      <p className="portal-webchat-hint">
        Paste this snippet just before <code>{"</body>"}</code> on every page where
        you want the Robin webchat widget to appear.
      </p>
    </div>
  );
}
