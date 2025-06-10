import type { SVGProps } from 'react';

export function ScholarChatLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="200"
      height="50"
      aria-label="Scholar Chat Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Book Icon */}
      <path d="M10 2H30C32.2091 2 34 3.79086 34 6V44C34 46.2091 32.2091 48 30 48H10C7.79086 48 6 46.2091 6 44V6C6 3.79086 7.79086 2 10 2Z" fill="url(#logoGradient)" />
      <path d="M12 6H28V42H12V6Z" fill="hsl(var(--card))" />
      <line x1="16" y1="10" x2="24" y2="10" stroke="hsl(var(--primary))" strokeWidth="2" />
      <line x1="16" y1="16" x2="28" y2="16" stroke="hsl(var(--primary))" strokeWidth="2" />
      <line x1="16" y1="22" x2="26" y2="22" stroke="hsl(var(--primary))" strokeWidth="2" />
      
      {/* Text "Scholar Chat" */}
      <text
        x="45"
        y="32"
        fontFamily="var(--font-sans), Arial, sans-serif"
        fontSize="24"
        fontWeight="600"
        fill="hsl(var(--foreground))"
      >
        Scholar Chat
      </text>
    </svg>
  );
}
