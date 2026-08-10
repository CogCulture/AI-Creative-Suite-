import React, { useState } from 'react';

// Shared model brand colors and gradients
export const LLM_BRAND = {
  claude: {
    label: 'Claude Sonnet',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    slug: 'claude'
  },
  'gpt-4o': {
    label: 'GPT-4o',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    slug: 'openai'
  },
  gemini: {
    label: 'Gemini Flash',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    slug: 'google'
  },
  'mistral-small': {
    label: 'Mistral Small',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    slug: 'mistralai'
  },
  'mistral-large': {
    label: 'Mistral Large',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    slug: 'mistralai'
  },
  'gpt-4o-mini': {
    label: 'GPT-4o Mini',
    color: '#6ee7b7',
    gradient: 'linear-gradient(135deg, #6ee7b7, #10b981)',
    slug: 'openai'
  },
};

// CDN Icon Component with High-Fidelity Fallback
const SmartIcon = ({ brand, size, color, fallback: Fallback }) => {
  const [cdnFailed, setCdnFailed] = useState(false);

  if (cdnFailed) {
    return <Fallback size={size} color={color} />;
  }

  // Simple Icons CDN allows custom coloring via URL path suffix
  const colorHex = color 
    ? (color.toLowerCase() === 'white' ? 'fff' : color.replace('#', '')) 
    : null;

  const url = colorHex 
    ? `https://cdn.simpleicons.org/${brand}/${colorHex}`
    : `https://cdn.simpleicons.org/${brand}`;

  return (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      onError={() => setCdnFailed(true)}
      style={{ display: 'block' }}
    />
  );
};

// Inline SVG Fallbacks (High Fidelity)
export const ClaudeIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <circle cx="40" cy="20" r="3" fill={color} />
    <circle cx="40" cy="28" r="3" fill={color} />
    <circle cx="40" cy="36" r="3" fill={color} />
    <circle cx="40" cy="44" r="3" fill={color} />
    <circle cx="40" cy="52" r="3" fill={color} />
    <circle cx="40" cy="60" r="3" fill={color} />
    <circle cx="32" cy="24" r="3" fill={color} />
    <circle cx="32" cy="32" r="3" fill={color} />
    <circle cx="32" cy="40" r="3" fill={color} />
    <circle cx="32" cy="48" r="3" fill={color} />
    <circle cx="32" cy="56" r="3" fill={color} />
    <circle cx="48" cy="24" r="3" fill={color} />
    <circle cx="48" cy="32" r="3" fill={color} />
    <circle cx="48" cy="40" r="3" fill={color} />
    <circle cx="48" cy="48" r="3" fill={color} />
    <circle cx="48" cy="56" r="3" fill={color} />
    <circle cx="24" cy="28" r="3" fill={color} />
    <circle cx="24" cy="36" r="3" fill={color} />
    <circle cx="24" cy="44" r="3" fill={color} />
    <circle cx="24" cy="52" r="3" fill={color} />
    <circle cx="56" cy="28" r="3" fill={color} />
    <circle cx="56" cy="36" r="3" fill={color} />
    <circle cx="56" cy="44" r="3" fill={color} />
    <circle cx="56" cy="52" r="3" fill={color} />
  </svg>
);

export const OpenAIIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill={color} />
  </svg>
);

export const MistralIcon = ({ size = 16, color = "#F2A73B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M17.143 3.429v3.428h-3.429v3.429h-3.428V6.857H6.857V3.43H3.43v13.714H0v3.428h10.286v-3.428H6.857v-3.429h3.429v3.429h3.429v-3.429h3.428v3.429h-3.428v3.428H24v-3.428h-3.43V3.429z" fill={color} />
  </svg>
);

export const GeminiIcon = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {!color && (
      <defs>
        <linearGradient id="gemini-grad" x1="5%" y1="5%" x2="95%" y2="95%">
          <stop offset="0%" stopColor="#EA4335" />
          <stop offset="10%" stopColor="#EA4335" />
          <stop offset="35%" stopColor="#FBBC05" />
          <stop offset="55%" stopColor="#5BB0FF" />
          <stop offset="90%" stopColor="#5BB0FF" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
    )}
    <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill={color || "url(#gemini-grad)"} />
  </svg>
);

export const getLLMIcon = (modelId, size = 16, color) => {
  if (modelId.includes('claude')) return <ClaudeIcon size={size} color={color} />;
  if (modelId.includes('gpt')) return <OpenAIIcon size={size} color={color} />;
  if (modelId.includes('mistral')) return <MistralIcon size={size} color={color} />;
  if (modelId.includes('gemini')) return <GeminiIcon size={size} color={color} />;
  return null;
};
