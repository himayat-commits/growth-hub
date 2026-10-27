// Plain <details> question list — works without JavaScript and is keyboard
// accessible out of the box. The first answer starts open.

export interface Question {
  q: string;
  a: React.ReactNode;
}

export default function Questions({ items }: { items: Question[] }) {
  return (
    <div className="site-faq">
      {items.map((item, i) => (
        <details key={item.q} open={i === 0}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
