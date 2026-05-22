// Minimal Lexical JSON → JSX renderer for Payload richText fields.
// Supports the formats case studies actually use: paragraphs, headings
// (h2/h3), bold + italic + links, unordered/ordered lists, blockquotes.
//
// Anything we don't recognise falls back to rendering plain text from
// children — so unknown nodes degrade gracefully instead of crashing.

import type { ReactNode } from 'react';

// Lexical text-format bitmask (Payload Lexical follows the spec).
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 1 << 1;
const FORMAT_STRIKETHROUGH = 1 << 2;
const FORMAT_UNDERLINE = 1 << 3;
const FORMAT_CODE = 1 << 4;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = Record<string, any>;

function renderTextNode(node: Node, key: number): ReactNode {
  let el: ReactNode = node.text ?? '';
  const fmt = typeof node.format === 'number' ? node.format : 0;
  if (fmt & FORMAT_CODE) el = <code key={key}>{el}</code>;
  if (fmt & FORMAT_STRIKETHROUGH) el = <s key={key}>{el}</s>;
  if (fmt & FORMAT_UNDERLINE) el = <u key={key}>{el}</u>;
  if (fmt & FORMAT_ITALIC) el = <em key={key}>{el}</em>;
  if (fmt & FORMAT_BOLD) el = <strong key={key}>{el}</strong>;
  return el;
}

function renderChildren(children: unknown): ReactNode[] {
  if (!Array.isArray(children)) return [];
  return children.map((child, i) => renderNode(child as Node, i));
}

function renderNode(node: Node, key: number): ReactNode {
  if (!node || typeof node !== 'object') return null;
  switch (node.type) {
    case 'text':
      return renderTextNode(node, key);
    case 'linebreak':
      return <br key={key} />;
    case 'paragraph':
      return <p key={key}>{renderChildren(node.children)}</p>;
    case 'heading': {
      const tag = node.tag === 'h3' ? 'h3' : 'h2';
      return tag === 'h3'
        ? <h3 key={key}>{renderChildren(node.children)}</h3>
        : <h2 key={key}>{renderChildren(node.children)}</h2>;
    }
    case 'list': {
      const ordered = node.listType === 'number' || node.tag === 'ol';
      return ordered
        ? <ol key={key}>{renderChildren(node.children)}</ol>
        : <ul key={key}>{renderChildren(node.children)}</ul>;
    }
    case 'listitem':
      return <li key={key}>{renderChildren(node.children)}</li>;
    case 'quote':
      return <blockquote key={key}>{renderChildren(node.children)}</blockquote>;
    case 'link': {
      const href = String(node.fields?.url ?? node.url ?? '#');
      const isExternal = /^https?:/.test(href);
      return (
        <a
          key={key}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {renderChildren(node.children)}
        </a>
      );
    }
    case 'autolink':
      return (
        <a key={key} href={String(node.fields?.url ?? '#')} target="_blank" rel="noopener noreferrer">
          {renderChildren(node.children)}
        </a>
      );
    default:
      // Unknown node — render children if present, otherwise nothing.
      return Array.isArray(node.children) ? <>{renderChildren(node.children)}</> : null;
  }
}

export interface LexicalRichTextProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  className?: string;
}

export default function LexicalRichText({ content, className }: LexicalRichTextProps) {
  // Payload wraps content under `root` (the editor state). Sometimes the
  // shape is already a node tree without that wrapper — handle both.
  const root = content?.root ?? content;
  if (!root || typeof root !== 'object' || !Array.isArray(root.children)) return null;
  return <div className={className}>{renderChildren(root.children)}</div>;
}
