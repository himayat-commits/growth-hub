'use client';

/** Prints the page. Guides print as a one-page checklist (see the print
 *  rules under "Guides" in globals.css), handy as a Session handout. */
export default function PrintButton({ label = 'Print the checklist' }: { label?: string }) {
  return (
    <button type="button" className="btn btn-secondary guide-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
