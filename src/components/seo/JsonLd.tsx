// Inline <script type="application/ld+json"> emitter shared by the typed
// schema components in this folder. Stringifies the payload with
// JSON.stringify so trailing newlines/whitespace don't leak into the DOM.
//
// dangerouslySetInnerHTML is the supported way to emit JSON-LD in React;
// the payload is server-controlled and not user input, so no injection risk.

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      // Escape "</" to defang any accidental closing-script-tag in fields like description.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
