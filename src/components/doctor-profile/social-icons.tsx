import type { SVGProps } from "react";

export function WhatsAppIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M20.5 3.5A11 11 0 0 0 2.2 16.3L1 23l6.9-1.2A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-4.1.7.7-4-.2-.4A9 9 0 1 1 12 20.5Zm5.2-6.7c-.3-.1-1.7-.8-2-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.1-.6 0a7.5 7.5 0 0 1-2.2-1.3 8.2 8.2 0 0 1-1.5-1.8c-.2-.3 0-.4.1-.6l.4-.4.2-.3a.9.9 0 0 0 .1-.5c0-.1-.6-1.4-.9-2s-.5-.5-.6-.5h-.5c-.2 0-.5.1-.8.4s-1.1 1-1.1 2.4 1.1 2.8 1.2 3c.2.2 2 3 4.8 4.1.7.3 1.2.4 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.3.2-.6.2-1.1.1-1.2s-.3-.2-.6-.3Z" />
    </svg>
  );
}

export function InstagramIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5ZM17.8 6.2a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2Z" />
    </svg>
  );
}

export function FacebookIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M13.5 22v-8.2h2.8l.4-3.1h-3.2V9.5c0-.9.3-1.6 1.7-1.6h1.7V5.1c-.8-.1-1.8-.2-3-.2-3 0-5 1.8-5 5.1v2.8H6v3.1h2.9V22h4.6Z" />
    </svg>
  );
}

export function LinkedInIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M6.5 8.5H3.7V21h2.8V8.5ZM5.1 2.8A1.7 1.7 0 1 0 5.1 6.2 1.7 1.7 0 0 0 5.1 2.8ZM10.2 8.5H7.5V21h2.7v-6.1c0-1.6.3-3.1 2.3-3.1s2 1.8 2 3.2V21h2.8v-6.8c0-3.3-.7-5.7-4.1-5.7-1.6 0-2.7.9-3.1 1.8h-.1V8.5Z" />
    </svg>
  );
}
