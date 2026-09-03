import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ExternalLink, Sparkles, Copy, Check } from 'lucide-react';

interface ArticleRendererProps {
  content: string;
  showNativeAd?: boolean;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({
  content,
  showNativeAd = false,
}) => {
  if (!content) return null;

  // Check if content has custom [AFFILIATE: ...] shortcodes
  // We can transform or render them cleanly
  const renderAffiliateCallout = (rawTag: string, key: string | number) => {
    const titleMatch = rawTag.match(/\[AFFILIATE:\s*([^|\]]+)/i);
    const urlMatch = rawTag.match(/url=["']([^"']+)["']/i);
    const badgeMatch = rawTag.match(/badge=["']([^"']+)["']/i);

    const title = titleMatch ? titleMatch[1].trim() : 'Recommended Resource';
    const url = urlMatch ? urlMatch[1] : '#';
    const badge = badgeMatch ? badgeMatch[1] : 'Curated Pick';

    return (
      <div
        key={key}
        className="my-8 p-5 sm:p-6 rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-accent)] uppercase font-semibold tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{badge}</span>
          </div>
          <h5 className="font-heading font-semibold text-lg text-[var(--color-text-primary)]">
            {title}
          </h5>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-body max-w-[65ch]">
            Curated and tested by the Vertex Theory editorial desk.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold tracking-wide transition-colors shrink-0 shadow-sm"
        >
          <span>View Resource</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  };

  // Pre-process content blocks if needed, or render unified ReactMarkdown with rehypeRaw
  // To handle the 70% native banner ad cleanly:
  // If showNativeAd is true, we can split content into major sections and inject the banner at ~70%
  const hasAffiliateShortcode = /\[AFFILIATE:/i.test(content);

  // Custom component map for ReactMarkdown
  const customComponents = {
    h2: ({ node, children, ...props }: any) => (
      <h2
        className="article-h2 font-heading font-semibold text-[26px] md:text-[30px] leading-[1.3] text-[var(--color-text-primary)] mt-8 mb-4 tracking-[-0.015em]"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ node, children, ...props }: any) => (
      <h3
        className="article-h3 font-heading font-semibold text-[20px] md:text-[22px] leading-[1.3] text-[var(--color-text-primary)] mt-7 mb-3 tracking-[-0.01em]"
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ node, children, ...props }: any) => {
      // Check if paragraph contains only an affiliate shortcode
      const textVal = String(children);
      if (/^\[AFFILIATE:/i.test(textVal.trim())) {
        return renderAffiliateCallout(textVal.trim(), 'affiliate-block');
      }
      return (
        <p
          className="font-body font-normal text-[16px] md:text-[18px] leading-[1.7] max-w-[65ch] text-[var(--color-text-secondary)] mb-6 break-words"
          {...props}
        >
          {children}
        </p>
      );
    },
    strong: ({ node, children, ...props }: any) => (
      <strong className="font-semibold text-[var(--color-text-primary)]" {...props}>
        {children}
      </strong>
    ),
    b: ({ node, children, ...props }: any) => (
      <strong className="font-semibold text-[var(--color-text-primary)]" {...props}>
        {children}
      </strong>
    ),
    em: ({ node, children, ...props }: any) => (
      <em className="italic text-inherit" {...props}>
        {children}
      </em>
    ),
    i: ({ node, children, ...props }: any) => (
      <em className="italic text-inherit" {...props}>
        {children}
      </em>
    ),
    ul: ({ node, children, ...props }: any) => (
      <ul className="list-disc pl-6 my-6 space-y-2 text-[var(--color-text-secondary)]" {...props}>
        {children}
      </ul>
    ),
    ol: ({ node, children, ...props }: any) => (
      <ol className="list-decimal pl-6 my-6 space-y-2 text-[var(--color-text-secondary)]" {...props}>
        {children}
      </ol>
    ),
    li: ({ node, children, ...props }: any) => (
      <li className="font-body text-[16px] md:text-[18px] leading-[1.7] text-[var(--color-text-secondary)] max-w-[65ch] pl-1" {...props}>
        {children}
      </li>
    ),
    a: ({ node, href, children, ...props }: any) => {
      const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)] transition-colors underline-offset-4 font-medium"
          {...props}
        >
          {children}
        </a>
      );
    },
    blockquote: ({ node, children, ...props }: any) => (
      <blockquote
        className="border-l-4 border-[var(--color-accent)] pl-5 sm:pl-6 my-7 py-3 font-heading font-medium text-[17px] sm:text-[19px] leading-[1.6] text-[var(--color-text-primary)] bg-[var(--color-accent-subtle)] rounded-r-xl"
        {...props}
      >
        {children}
      </blockquote>
    ),
    img: ({ node, src, alt, ...props }: any) => (
      <img
        src={src}
        alt={alt || 'Article visual'}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="rounded-2xl border border-[var(--color-border)] my-8 max-w-full h-auto mx-auto shadow-sm block object-cover"
        {...props}
      />
    ),
    table: ({ node, children, ...props }: any) => (
      <div className="my-8 overflow-x-auto rounded-xl border border-[var(--color-border)] shadow-xs bg-[var(--color-surface)]">
        <table className="w-full text-left border-collapse min-w-[500px]" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ node, children, ...props }: any) => (
      <thead className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ node, children, ...props }: any) => (
      <tbody className="divide-y divide-[var(--color-border-subtle)]" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ node, children, ...props }: any) => (
      <tr className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({ node, children, ...props }: any) => (
      <th className="px-4 py-3 font-heading font-semibold text-xs tracking-wider uppercase text-[var(--color-text-primary)]" {...props}>
        {children}
      </th>
    ),
    td: ({ node, children, ...props }: any) => (
      <td className="px-4 py-3.5 font-body text-sm sm:text-base text-[var(--color-text-secondary)]" {...props}>
        {children}
      </td>
    ),
    hr: ({ node, ...props }: any) => (
      <hr className="my-10 border-0 border-t border-[var(--color-border)]" {...props} />
    ),
    br: ({ node, ...props }: any) => (
      <br {...props} />
    ),
    pre: ({ node, children, ...props }: any) => (
      <pre
        className="article-code-block font-mono font-normal text-[14px] md:text-[15px] leading-[1.5] p-5 rounded-xl bg-[var(--color-code-bg)] text-[var(--color-code-text)] border border-[var(--color-code-border)] overflow-x-auto max-w-full my-7 shadow-md"
        {...props}
      >
        {children}
      </pre>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      if (inline || !className) {
        return (
          <code
            className="font-mono font-normal text-[0.875em] bg-[var(--color-code-inline-bg)] text-[var(--color-code-inline-text)] px-1.5 py-0.5 rounded"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className="font-mono text-inherit" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="article-content max-w-full min-w-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={customComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
