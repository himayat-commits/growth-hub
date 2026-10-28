// Shared layout for the guides share cards (hub and each guide), in the same
// teal-and-lime style as the other page cards.

export function GuideOgCard({ kicker, lines, foot }: { kicker: string; lines: string[]; foot: string }) {
  // Long guide titles wrap onto more lines, so the type steps down with them.
  const fontSize = lines.join(' ').length > 34 ? 76 : 92;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 88px',
        background: '#0D3F48',
        color: '#F3F0E7',
        fontFamily: 'serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 18px',
            borderRadius: 999,
            border: '1px solid rgba(243,240,231,0.35)',
            fontSize: 22,
            color: '#E3F29C',
            letterSpacing: '0.04em',
          }}
        >
          {kicker}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
          <span style={{ color: '#F3F0E7' }}>Growth Hub</span>
          <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>by Himayat</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {lines.map((line, i) => (
          <span
            key={line}
            style={{
              fontSize,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: i === lines.length - 1 ? '#E3F29C' : '#F3F0E7',
            }}
          >
            {line}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22 }}>
        <span style={{ color: 'rgba(243,240,231,0.7)' }}>Plain-English checklists · Free · No sign-up</span>
        <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>{foot}</span>
      </div>
    </div>
  );
}
