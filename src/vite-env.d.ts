/// <reference types="vite/client" />

declare class HTMLRewriter {
  on(
    selector: string,
    handlers: {
      element?: (element: {
        tagName: string;
        attributes: IterableIterator<[string, string]>;
        getAttribute(name: string): string | null;
        setAttribute(name: string, value: string): void;
        removeAttribute(name: string): void;
        before(content: string, options?: { html?: boolean }): void;
        after(content: string, options?: { html?: boolean }): void;
        prepend(content: string, options?: { html?: boolean }): void;
        append(content: string, options?: { html?: boolean }): void;
        setInnerContent(content: string, options?: { html?: boolean }): void;
        remove(): void;
        removeAndKeepContent(): void;
      }) => void | Promise<void>;
      text?: (text: {
        text: string;
        lastInTextNode: boolean;
        before(content: string, options?: { html?: boolean }): void;
        after(content: string, options?: { html?: boolean }): void;
        replace(content: string, options?: { html?: boolean }): void;
        remove(): void;
      }) => void | Promise<void>;
      comments?: (comment: unknown) => void | Promise<void>;
    }
  ): HTMLRewriter;
  transform(response: Response): Response;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
