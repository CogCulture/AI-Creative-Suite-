import React, { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'

// Configure marked for rich copywriting rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

const hasDocumentStructure = (txt) => {
  if (!txt || typeof txt !== "string") return false;
  return (
    /^#{1,4}\s+/m.test(txt) || // ### Headings
    /\b(Subject Line|Email\s+\d+|Dear\s+\[|Best regards|Warm regards|Cheers|Sincerely|Why Choose Us|Here's how to redeem)\b/i.test(txt) ||
    /^-{3,}$/m.test(txt) || // --- dividers
    /\[CTA Button/i.test(txt)
  );
};

const formatCopyAgentMarkdown = (text) => {
  if (!text) return "";
  // Convert bullet dots (• or ●) at the start of a line to standard markdown list items (- )
  let formatted = text.replace(/^[\t ]*[•●][\t ]+/gm, "- ");
  // Ensure horizontal rules have proper clean line breaks around them
  formatted = formatted.replace(/\n?---+\n?/g, "\n\n---\n\n");
  // Convert [CTA Button: Text] to styled button HTML
  formatted = formatted.replace(/\[CTA Button:\s*([^\]]+)\]/gi, '<div class="copy-cta-button">$1</div>');
  try {
    return marked.parse(formatted);
  } catch (_) {
    return String(formatted);
  }
};

// Stubbed/dummy components to avoid missing files
const LinkedInPostModal = () => null;
const InstagramPostModal = () => null;
const FacebookPostModal = () => null;
const TwitterPostModal = () => null;
const PinterestPostModal = () => null;
const RedditPostModal = () => null;
import LLMComparisonCard from './LLMComparisonCard';
const Tooltip = ({ children }) => children;
const CopyAgentLogo = () => null;

const API_BASE_URL = "";
const getConversationFile = async () => "";
const getFileIcon = () => "";
const isIncognitoMode = false;


// 🔥 Add CSS for share menu animation
const shareMenuStyles = document.createElement('style');
shareMenuStyles.textContent = `
  @keyframes shareMenuSlideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// 🔥 Dynamic CSS styles
const hideScrollbarStyles = document.createElement('style');
hideScrollbarStyles.textContent = `
  .message:hover .message-actions {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .message-actions {
    visibility: hidden;
  }
`;
if (!document.querySelector('#hide-scrollbar')) {
  hideScrollbarStyles.id = 'hide-scrollbar';
  document.head.appendChild(hideScrollbarStyles);
}
if (!document.querySelector('#share-menu-animation')) {
  shareMenuStyles.id = 'share-menu-animation';
  document.head.appendChild(shareMenuStyles);
}

  // 🔥 LOADING JOKES
const LOADING_JOKES = [
    "Teaching hamsters to run the servers... 🐹",
    "Waking up the interns... 😴",
    "Consulting the Oracle of Delphi... 🔮",
    "Counting pixels one by one... 🔢",
    "Explaining the prompt to my grandma... 👵",
    "Searching for the 'Any' key... ⌨️",
    "Downloading more RAM... 💾",
    "Re-routing the flux capacitor... ⚡",
    "Ordering pizza for the server... 🍕",
    "Asking the rubber duck for advice... 🦆",
    "Convincing AI it's not Skynet... yet 🤖",
    "Teaching the server to sing... 🎵",
    "Debugging the rubber duck... again 🦆",
    "Looking for the semicolon I forgot in 2012... ;",
    "Asking Stack Overflow for life advice... 🆘",
    "Compiling coffee into code... ☕",
    "Herding cats in the cloud... ☁️",
    "Optimizing for maximum laziness... 💤",
    "Converting caffeine to JSON... 🔄",
    "Waiting for the sun to rise in the west... ☀️",
    "Trying to center a div... 📏",
    "Deleting production database... just kidding 😅"
  ];

const LoadingJoke = () => {
  const [joke, setJoke] = useState("");
  const [fade, setFade] = useState(true);

  useEffect(() => {
      let timeoutId;
      // Rotate jokes every 3 seconds
    const rotateJoke = () => {
        setFade(false); // Fade out
        timeoutId = setTimeout(() => {
        const randomJoke = LOADING_JOKES[Math.floor(Math.random() * LOADING_JOKES.length)];
          setJoke(randomJoke);
          setFade(true); // Fade in
        }, 300);
      };

      rotateJoke(); // Initial joke
    const interval = setInterval(rotateJoke, 4000);

    return () => {
        clearInterval(interval);
        clearTimeout(timeoutId);
      };
    }, []);

  return (
      <div className="loading-joke-container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 20px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.05)',
        maxWidth: 'fit-content',
        margin: '10px 0',
        transition: 'all 0.3s ease'
      }}>
        {/* Advanced Gradient Spinner */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 1) 100%)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
          animation: 'spin 0.8s linear infinite',
          flexShrink: 0
        }} />

        {/* Animated Text */}
        <span style={{
          fontSize: '14px',
          color: '#374151',
          fontWeight: '500',
          opacity: fade ? 1 : 0,
          transform: fade ? 'translateY(0)' : 'translateY(5px)',
          transition: 'all 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          {joke}
        </span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
const getUserAvatarColor = (identifier) => {
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#a855f7'
    ];

    if (!identifier) return '#6b7280';

    const hash = identifier.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };




const platformIcons = {
    linkedin: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    instagram: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    facebook: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    twitter: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    pinterest: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
      </svg>
    ),
    reddit: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M24 12.3c0-1.7-1.4-3.1-3.1-3.1-.7 0-1.4.2-1.9.7-1.8-1.3-4.3-2.1-7-2.2l1.4-4.3 3.8.9c0 1 .8 1.8 1.8 1.8 1 0 1.8-.8 1.8-1.8S20.9 2.5 19.9 2.5c-.7 0-1.4.4-1.7 1l-4.3-1c-.3-.1-.6.1-.7.4L11.5 7c-2.8.1-5.4.9-7.2 2.2-.5-.4-1.2-.7-1.9-.7-1.7 0-3.1 1.4-3.1 3.1 0 1.3.8 2.4 1.9 2.9-.1.4-.1.8-.1 1.2 0 3.9 4.9 7.1 11 7.1s11-3.2 11-7.1c0-.4 0-.8-.1-1.2 1.1-.5 1.9-1.6 1.9-2.9zM7.4 14.9c-.8 0-1.5-.6-1.5-1.4s.7-1.4 1.5-1.4 1.5.6 1.5 1.4-.7 1.4-1.5 1.4zm9.2 0c-.8 0-1.5-.6-1.5-1.4s.7-1.4 1.5-1.4 1.5.6 1.5 1.4-.7 1.4-1.5 1.4zm-9 3.1c.9.9 2.7 1.4 4.4 1.4s3.5-.5 4.4-1.4c.2-.2.2-.5 0-.7s-.5-.2-.7 0c-.7.6-2.2 1.1-3.7 1.1s-3-.4-3.7-1.1c-.2-.2-.5-.2-.7 0s-.2.5 0 .7z" />
      </svg>
    )
  };



const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const parseOptions = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const parsedOptions = [];
  let introLines = [];
  let outroLines = [];
  let inOptionsSection = false;
  let hasParsedAnyOption = false;

  // Regex to match:
  // - Option 1 "..."
  // - 1. "..."
  // - Option 1: ...
  const optionRegex = /^\s*(?:Option\s+(\d+)|(\d+)\.)\s*(.*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(optionRegex);

    if (match) {
      const optId = match[1] || match[2];
      const optContent = match[3].trim();
      const isOption = line.toLowerCase().includes('option') || optContent.includes('"') || optContent.includes('→') || optContent.includes('->') || optContent.includes('—');
      
      if (isOption) {
        inOptionsSection = true;
        hasParsedAnyOption = true;
        
        // Helper to strip markdown bold asterisks (**text**)
        const stripBold = (s) => s ? s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '').trim() : '';

        // Try to parse quotes and arrows
        let title = stripBold(optContent);
        let description = '';
        
        // Check if there is an arrow (→ or -> or —)
        const arrowMatch = optContent.match(/(.*?)(?:→|->|—)(.*)/);
        if (arrowMatch) {
          title = stripBold(arrowMatch[1]);
          description = stripBold(arrowMatch[2]);
        } else {
          // Check if there is text in quotes
          const quoteMatch = optContent.match(/^"([^"]+)"(.*)/);
          if (quoteMatch) {
            title = `"${stripBold(quoteMatch[1])}"`;
            description = stripBold(quoteMatch[2]);
          }
        }

        parsedOptions.push({
          id: optId,
          title: title,
          description: description,
          fullText: stripBold(optContent)
        });
      } else {
        if (inOptionsSection) {
          if (line.trim() === '') {
            // ignore empty line
          } else {
            inOptionsSection = false;
            outroLines.push(line);
          }
        } else {
          if (hasParsedAnyOption) {
            outroLines.push(line);
          } else {
            introLines.push(line);
          }
        }
      }
    } else {
      if (inOptionsSection) {
        if (line.trim() === '') {
          // ignore empty line
        } else {
          inOptionsSection = false;
          outroLines.push(line);
        }
      } else {
        if (hasParsedAnyOption) {
          outroLines.push(line);
        } else {
          introLines.push(line);
        }
      }
    }
  }

  if (parsedOptions.length > 0) {
    return {
      intro: introLines.join('\n').trim(),
      options: parsedOptions,
      outro: outroLines.join('\n').trim()
    };
  }
  return null;
};

const OptionCanvasCard = ({ option }) => {
  const [showRefine, setShowRefine] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(option.fullText || option.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([option.fullText || option.title], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `option_${option.displayIndex || option.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefineSubmit = () => {
    if (!feedback.trim()) return;
    window.dispatchEvent(new CustomEvent('refine-option', {
      detail: {
        optionId: option.displayIndex || option.id,
        optionText: option.title,
        feedback: feedback
      }
    }));
    setFeedback('');
    setShowRefine(false);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Title / Headline ABOVE the canvas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13.5px',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '8px'
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Option {option.displayIndex || option.id} | Content Assistant</span>
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'normal' }}>[=]</span>
      </div>

      {/* Single Canvas Div Box */}
      <div className="canvas-card" style={{
        position: 'relative',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Top Right Action Buttons (Edit, Copy, Download) */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button className="canvas-action-btn" onClick={() => setShowRefine(!showRefine)} title={showRefine ? "Cancel Edit" : "Edit option"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button className="canvas-action-btn" onClick={handleCopy} title={copied ? "Copied!" : "Copy option"}>
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
          <button className="canvas-action-btn" onClick={handleDownload} title="Download option">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>

        {/* Clean Content Area (No Line Numbers, No Separators) */}
        <div style={{ paddingRight: '80px' }}>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px', marginBottom: option.description ? '4px' : '0' }}>
            {option.title}
          </div>
          {option.description && (
            <div style={{ color: '#4b5563', fontStyle: 'italic', fontSize: '13.5px' }}>
              {option.description}
            </div>
          )}
        </div>

        {/* Seamless Refinement Input inside the same Canvas Div */}
        {showRefine && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
            <input
              type="text"
              className="canvas-refine-input"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Type refinement feedback (e.g., 'make it punchier')..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRefineSubmit();
              }}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              autoFocus
            />
            <button
              onClick={handleRefineSubmit}
              style={{
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Refine
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const platformColors = {
    linkedin: '#0A66C2',
    instagram: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    facebook: '#1877F2',
    twitter: '#000000',
    pinterest: '#E60023',
    reddit: '#FF4500'
  };

const MessageItem = React.memo(({
  msg,
  onShowPricing,
  onOpenFilePreview,
  isShareMenuOpen,
  onToggleShareMenu,
  onShare,
  isProcessing,
  isLocked = false,
  onEditMessage,
  onCopyMessage,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  editText,
  setEditText,
  onRegenerate,
  onApprove,
  profilePicture,
  userEmail,
  messages,
  selectedVersionIndex,
  setSelectedVersionIndex,
  selectedAssistantIndex,
  setSelectedAssistantIndex,
  assistantGroup,
  isBaselineAssistantMessage = false,
  indexInConversation,
  approvedMsgIds,
  setApprovedMsgIds,
  hoveredApprovedId,
  setHoveredApprovedId
}) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const bubbleRef = useRef(null);

  const handleCopyMessage = () => {
    const selection = window.getSelection();
    let textToCopy = msg.text;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (bubbleRef.current && (
        bubbleRef.current.contains(range.startContainer) ||
        bubbleRef.current.contains(range.endContainer) ||
        bubbleRef.current.contains(range.commonAncestorContainer)
      )) {
        const selectedText = selection.toString();
        if (selectedText.trim()) {
          textToCopy = selectedText;
        }
      }
    }
    if (onCopyMessage) onCopyMessage(textToCopy);
    setCopyButtonText('Copied');
    setTimeout(() => setCopyButtonText('Copy'), 2000);
  };

  if (msg.role === 'status') {
          return null;
        }

        // ── Multi-LLM Comparison Card ─────────────────────────────────────────
        if (msg.role === 'variants') {
          return (
            <div key={msg.id} style={{ marginBottom: '20px' }}>
              <LLMComparisonCard
                sessionId={msg.sessionId}
                userRequest={msg.userRequest}
                variants={msg.variants || []}
                conversationId={msg.conversationId}
                isLocked={isLocked && (msg.hasSelection || !!msg.selected_variant_content || !!msg.selected_variant_id)}
                onVariantSelected={(content, llmName) => {
                  // Dispatch a custom event so InputBar can display the selected content as a new message
                  window.dispatchEvent(new CustomEvent('variant-selected', {
                    detail: { content, llmName, messageId: msg.id }
                  }));
                }}
              />
              {/* Pagination Switcher for Baseline Assistant Messages */}
              {(() => {
                if (assistantGroup && assistantGroup.length > 1) {
                  const userMsg = messages.slice(0, indexInConversation).reverse().find(m => m.role === 'user');
                  const key = userMsg ? userMsg.id : 'default';
                  const activeIdx = selectedAssistantIndex[key] !== undefined ? selectedAssistantIndex[key] : (assistantGroup.findIndex(m => m.isSelection || m.is_selection || messages.some(varMsg => varMsg.role === 'variants' && varMsg.selected_variant_content === m.text)) !== -1 ? assistantGroup.findIndex(m => m.isSelection || m.is_selection || messages.some(varMsg => varMsg.role === 'variants' && varMsg.selected_variant_content === m.text)) : assistantGroup.length - 1);
                  
                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0px',
                      color: '#6b7280',
                      fontSize: '12px',
                      fontWeight: 600,
                      userSelect: 'none',
                      marginTop: '8px'
                    }}>
                      <button
                        onClick={() => {
                          if (activeIdx > 0) {
                            const newIdx = activeIdx - 1;
                            setSelectedAssistantIndex(prev => ({ ...prev, [key]: newIdx }));
                            
                            // 🔥 NEW: Trigger variant-selected so Arena Div & InputBar sync!
                            const newMsg = assistantGroup[newIdx];
                            const vArray = Array.isArray(msg.variants) ? msg.variants : (typeof msg.variants === 'string' ? JSON.parse(msg.variants) : []);
                            const matchedVariant = vArray.find(v => v.content === newMsg.text);
                            
                            const targetContent = matchedVariant ? matchedVariant.content : newMsg.text;
                            const targetLlmName = matchedVariant ? matchedVariant.llm_name : (newMsg.llmUsed || newMsg.llm_name);
                            
                            if (targetContent && targetLlmName) {
                              window.dispatchEvent(new CustomEvent('variant-selected', {
                                detail: { content: targetContent, llmName: targetLlmName, messageId: msg.id, isPagination: true }
                              }));
                            }
                          }
                        }}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
                          display: 'flex', alignItems: 'center', color: activeIdx > 0 ? '#6b7280' : '#d1d5db',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { if (activeIdx > 0) { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#374151'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = activeIdx > 0 ? '#6b7280' : '#d1d5db'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                      <span style={{ margin: '0 2px' }}>{activeIdx + 1}/{assistantGroup.length}</span>
                      <button
                        onClick={() => {
                          if (activeIdx < assistantGroup.length - 1) {
                            const newIdx = activeIdx + 1;
                            setSelectedAssistantIndex(prev => ({ ...prev, [key]: newIdx }));
                            
                            // 🔥 NEW: Trigger variant-selected so Arena Div & InputBar sync!
                            const newMsg = assistantGroup[newIdx];
                            const vArray = Array.isArray(msg.variants) ? msg.variants : (typeof msg.variants === 'string' ? JSON.parse(msg.variants) : []);
                            const matchedVariant = vArray.find(v => v.content === newMsg.text);
                            
                            const targetContent = matchedVariant ? matchedVariant.content : newMsg.text;
                            const targetLlmName = matchedVariant ? matchedVariant.llm_name : (newMsg.llmUsed || newMsg.llm_name);
                            
                            if (targetContent && targetLlmName) {
                              window.dispatchEvent(new CustomEvent('variant-selected', {
                                detail: { content: targetContent, llmName: targetLlmName, messageId: msg.id, isPagination: true }
                              }));
                            }
                          }
                        }}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
                          display: 'flex', alignItems: 'center', color: activeIdx < assistantGroup.length - 1 ? '#6b7280' : '#d1d5db',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { if (activeIdx < assistantGroup.length - 1) { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#374151'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = activeIdx < assistantGroup.length - 1 ? '#6b7280' : '#d1d5db'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              {isProcessing && <LoadingJoke />}
            </div>
          );
        }


        return (
          <div key={msg.id}>
            <div className={`message${msg.role === 'user' ? ' user-message' : ''}`} style={{ position: 'relative', alignItems: 'flex-start', marginBottom: msg.role === 'assistant' ? '0px' : '24px' }}>
              {msg.role === 'user' ? (
                <div
                  className="avatar user-avatar"
                  style={{
                    background: (!msg.user_email || msg.user_email === (userEmail || localStorage.getItem('userEmail')))
                      ? '#111827'
                      : getUserAvatarColor(msg.user_name || msg.user_email),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    flexShrink: 0,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%'
                  }}
                >
                  {(!msg.user_email || msg.user_email === (userEmail || localStorage.getItem('userEmail'))) ? (
                    <SafeAvatar src={profilePicture} name={msg.user_name || msg.user_email || localStorage.getItem('userName')} />
                  ) : (
                    (msg.user_name || msg.user_email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
              ) : (
                <div
                  className="avatar assistant-avatar"
                  style={{
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  C
                </div>
              )}
              {/* 🔥 ADD LLM BADGE */}
              {msg.role === 'assistant' && msg.llmUsed && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50px',
                  background: msg.llmUsed.includes('claude') ? '#8b5cf6' :
                    msg.llmUsed.includes('gpt') ? '#10b981' :
                      msg.llmUsed.includes('gemini') ? '#3b82f6' : '#f59e0b',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 10
                }}>
                  {msg.llmUsed.includes('claude') ? '' :
                    msg.llmUsed.includes('gpt') ? '' :
                      msg.llmUsed.includes('gemini') ? '' : ''}
                </div>
              )}
              {msg.role === 'user' && isEditing ? (
                <div className="bubble user" style={{ flex: 1, background: 'transparent' }}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      fontSize: '14px',
                      padding: '12px',
                      border: '2px solid #3b82f6',
                      borderRadius: '0px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      background: '#f3f4f6',
                      color: '#111827'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#9ca3af',
                      width: 'auto',
                      flexShrink: 1,
                      whiteSpace: 'nowrap'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Editing this message will delete all responses generated below this point.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={onCancelEdit}
                        style={{
                          padding: '6px 16px',
                          border: '1px solid #9ca3af',
                          background: '#ffffff',
                          color: '#6b7280',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onSaveEdit(editText)}
                        style={{
                          padding: '6px 16px',
                          background: '#111827',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#111827'}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  let displayedText = msg.text || '';
                  let msgVariants = [];
                  
                  // Parse variants for user messages
                  if (msg.role === 'user' && msg.variants) {
                      try {
                          msgVariants = typeof msg.variants === 'string' ? JSON.parse(msg.variants) : msg.variants;
                          if (!Array.isArray(msgVariants)) msgVariants = [];
                      } catch(e) { msgVariants = []; }
                      
                      const currentIdx = selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : msgVariants.length;
                      if (currentIdx < msgVariants.length) {
                          displayedText = msgVariants[currentIdx].prompt || '';
                      }
                  }
                  
                  // Apply variant response to assistant messages if the parent user message has a selected variant
                  if (msg.role === 'assistant' || msg.role === 'variants') {
                      const prevUserMsg = messages[messages.findIndex(m => m.id === msg.id) - 1];
                      if (prevUserMsg && prevUserMsg.role === 'user' && prevUserMsg.variants) {
                          let pVariants = [];
                          try {
                              pVariants = typeof prevUserMsg.variants === 'string' ? JSON.parse(prevUserMsg.variants) : prevUserMsg.variants;
                              if (!Array.isArray(pVariants)) pVariants = [];
                          } catch(e) { pVariants = []; }
                          
                          const pIdx = selectedVersionIndex[prevUserMsg.id] !== undefined ? selectedVersionIndex[prevUserMsg.id] : pVariants.length;
                          if (pIdx < pVariants.length) {
                              displayedText = pVariants[pIdx].response || '';
                          }
                      }
                  }
                  // Strip raw directive lines (e.g. :::writing{...}) so only natural language remains
                  if (displayedText && typeof displayedText === 'string') {
                    // Strip thought block <think>...</think> if present
                    displayedText = displayedText.replace(/<think>[\s\S]*?<\/think>/gi, '');
                    
                    displayedText = displayedText
                      .split('\n')
                      .filter(line => !line.trim().startsWith(':::'))
                      .join('\n')
                      .trim();
                  }

                  // If response is completely empty and we are not currently processing it, show a fallback message
                  if (!displayedText && !isProcessing && msg.role === 'assistant') {
                    displayedText = "Sorry, I encountered an issue while generating your response. Please try again.";
                  }

                  const isActuallySelected = msg.isSelection || msg.is_selection || 
                    (msg.role === 'assistant' && !!displayedText && messages.some(varMsg => 
                      varMsg.role === 'variants' && varMsg.selected_variant_content === displayedText
                    ));

                  return (
                    <div 
                      ref={bubbleRef}
                      className={`bubble${msg.role === 'user' ? ' user' : ''}`}
                      style={isActuallySelected ? { 
                        border: '2px solid #10b981', 
                        background: '#f0fdf4', 
                        position: 'relative',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                        borderRadius: '0px'
                      } : {}}
                    >
                      {isActuallySelected && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '12px',
                          background: '#10b981',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '2px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          zIndex: 1,
                          whiteSpace: 'nowrap'
                        }}>Selected</div>
                      )}
                      {/* 🔥 REPLACE "..." WITH JOKE SPINNER */}
                      {msg.role === 'user' && displayedText && displayedText.startsWith('Imported Chat History') ? (
                        (() => {
                          const lines = displayedText.split('\n');
                          let provider = 'ChatGPT';
                          for (const line of lines) {
                            if (line.toLowerCase().startsWith('source:')) {
                              provider = line.split(':')[1]?.trim() || 'ChatGPT';
                            }
                          }
                          
                          const renderProviderLogo = (prov) => {
                            const p = prov.toLowerCase();
                            if (p.includes('chatgpt') || p.includes('openai')) {
                              return (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                  <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="#000000" />
                                </svg>
                              );
                            }
                            if (p.includes('claude') || p.includes('anthropic')) {
                              return (
                                <svg width="18" height="18" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                  <circle cx="40" cy="20" r="3" fill="#CC9966" />
                                  <circle cx="40" cy="28" r="3" fill="#CC9966" />
                                  <circle cx="40" cy="36" r="3" fill="#CC9966" />
                                  <circle cx="40" cy="44" r="3" fill="#CC9966" />
                                  <circle cx="40" cy="52" r="3" fill="#CC9966" />
                                  <circle cx="40" cy="60" r="3" fill="#CC9966" />
                                  <circle cx="32" cy="24" r="3" fill="#CC9966" />
                                  <circle cx="32" cy="32" r="3" fill="#CC9966" />
                                  <circle cx="32" cy="40" r="3" fill="#CC9966" />
                                  <circle cx="32" cy="48" r="3" fill="#CC9966" />
                                  <circle cx="32" cy="56" r="3" fill="#CC9966" />
                                  <circle cx="48" cy="24" r="3" fill="#CC9966" />
                                  <circle cx="48" cy="32" r="3" fill="#CC9966" />
                                  <circle cx="48" cy="40" r="3" fill="#CC9966" />
                                  <circle cx="48" cy="48" r="3" fill="#CC9966" />
                                  <circle cx="48" cy="56" r="3" fill="#CC9966" />
                                  <circle cx="24" cy="28" r="3" fill="#CC9966" />
                                  <circle cx="24" cy="36" r="3" fill="#CC9966" />
                                  <circle cx="24" cy="44" r="3" fill="#CC9966" />
                                  <circle cx="24" cy="52" r="3" fill="#CC9966" />
                                  <circle cx="56" cy="28" r="3" fill="#CC9966" />
                                  <circle cx="56" cy="36" r="3" fill="#CC9966" />
                                  <circle cx="56" cy="44" r="3" fill="#CC9966" />
                                  <circle cx="56" cy="52" r="3" fill="#CC9966" />
                                </svg>
                              );
                            }
                            if (p.includes('gemini') || p.includes('google')) {
                              return (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                  <defs>
                                    <linearGradient id="gemini-grad-msg-bubble" x1="5%" y1="5%" x2="95%" y2="95%">
                                      <stop offset="0%" stopColor="#EA4335" />
                                      <stop offset="35%" stopColor="#FBBC05" />
                                      <stop offset="65%" stopColor="#4285F4" />
                                      <stop offset="100%" stopColor="#34A853" />
                                    </linearGradient>
                                  </defs>
                                  <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#gemini-grad-msg-bubble)" />
                                </svg>
                              );
                            }
                            return null;
                          };

                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              alignItems: 'flex-start'
                            }}>
                              <div style={{ 
                                fontWeight: 700, 
                                fontSize: '14px', 
                                color: '#1e1b4b',
                                letterSpacing: '-0.01em'
                              }}>
                                Imported Chat History
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                fontSize: '13px', 
                                color: '#4338ca',
                                fontWeight: 500
                              }}>
                                <span>Source:</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', verticalAlign: 'middle' }}>
                                  {renderProviderLogo(provider)}
                                  <strong style={{ color: '#312e81' }}>{provider}</strong>
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      ) : (displayedText === '...' || displayedText === '' || displayedText.startsWith('🧠')) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {isProcessing ? <LoadingJoke /> : null}
                          {/* Show the Thinking Text if available */}
                          {displayedText.startsWith('🧠') && (
                            <div style={{
                              fontSize: '13px',
                              color: '#4b5563',
                              fontStyle: 'italic',
                              paddingLeft: '4px',
                              animation: 'fadeIn 0.5s ease-in'
                            }}>
                              {displayedText}
                            </div>
                          )}
                        </div>
                      ) : (() => {
                        // If output has document structure (email sequences, headings, subject lines, dividers), render as full rich copy document
                        if (hasDocumentStructure(displayedText)) {
                          return (
                            <div
                              className="copyagent-rich-content"
                              dangerouslySetInnerHTML={{ __html: formatCopyAgentMarkdown(displayedText) }}
                            />
                          );
                        }

                        const sanitizedText = displayedText
                          .split('\n')
                          .map(line => line.trimEnd())
                          .join('\n')
                          .replace(/\n{3,}/g, '\n\n')
                          .trim();
                        const parsed = parseOptions(sanitizedText);
                        if (parsed && parsed.options && parsed.options.length > 0) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {parsed.intro && <div className="copyagent-rich-content" dangerouslySetInnerHTML={{ __html: formatCopyAgentMarkdown(parsed.intro) }} />}
                              <div className="options-canvas-container">
                                {parsed.options.map((opt, index) => (
                                  <OptionCanvasCard key={opt.id || index} option={{ ...opt, displayIndex: index + 1 }} />
                                ))}
                              </div>
                              {parsed.outro && <div className="copyagent-rich-content" dangerouslySetInnerHTML={{ __html: formatCopyAgentMarkdown(parsed.outro) }} />}
                            </div>
                          );
                        }
                        return (
                          <div
                            className="copyagent-rich-content"
                            dangerouslySetInnerHTML={{ __html: formatCopyAgentMarkdown(sanitizedText) }}
                          />
                        );
                      })()}

                    {/* 🔥 Top Up Button for token exhaustion message */}
                    {msg.role === 'assistant' && displayedText && (displayedText.includes("token credits are used") || displayedText.includes("Please top up")) && (
                      <button
                        onClick={onShowPricing}
                        style={{
                          marginTop: '12px',
                          background: '#EAB308',
                          color: '#000000',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Top up
                      </button>
                    )}

                    {/* Display attachments cleanly */}
                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {msg.attachments.map((file, i) => (
                          <div
                            key={i}
                            onClick={async () => {
                              if (!onOpenFilePreview) return;
                              let fileToPreview = { ...file };
                              if (!fileToPreview.data && fileToPreview.file_id) {
                                try {
                                  const fileData = await getConversationFile(currentConversationId, file.file_id);
                                  fileToPreview.data = fileData;
                                } catch (err) {
                                  console.error("Failed to load file preview data:", err);
                                }
                              }
                              onOpenFilePreview(fileToPreview);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              background: 'rgba(0, 0, 0, 0.03)',
                              borderRadius: 6,
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              fontSize: 13,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f0f9ff'
                              e.currentTarget.style.borderColor = '#0284c7'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <span style={{ fontSize: 18 }}>{getFileIcon(file.type, file.name)}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, color: '#111827' }}>{file.name}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{formatFileSize(file.size)}</div>
                            </div>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                let fileData = file.data;
                                if (!fileData && file.file_id) {
                                  const originalText = e.currentTarget.textContent;
                                  e.currentTarget.textContent = 'Downloading...';
                                  e.currentTarget.disabled = true;
                                  try {
                                    fileData = await getConversationFile(currentConversationId, file.file_id);
                                  } catch (err) {
                                    console.error("Failed to fetch file:", err);
                                  } finally {
                                    e.currentTarget.textContent = originalText;
                                    e.currentTarget.disabled = false;
                                  }
                                }
                                if (fileData) {
                                  const link = document.createElement('a');
                                  link.href = `data:${file.type};base64,${fileData}`;
                                  link.download = file.name;
                                  link.click();
                                } else {
                                  alert("Failed to download file. It may be missing on the server.");
                                }
                              }}
                              style={{
                                padding: '4px 8px',
                                background: '#111827',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 11,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#374151'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#111827'
                              }}
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()
            )}

              {msg.role === 'user' && !isEditing && (
                <div 
                  className="message-actions"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1px',
                    opacity: 1,
                    transition: 'opacity 0.2s ease',
                    marginRight: '0px'
                  }}
                >
                  <Tooltip text={copyButtonText} style={{ display: 'flex' }}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleCopyMessage}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: copyButtonText === 'Copied' ? '#10b981' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        if (copyButtonText !== 'Copied') {
                          e.currentTarget.style.color = '#374151';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = copyButtonText === 'Copied' ? '#10b981' : '#6b7280';
                      }}
                    >
                      {copyButtonText === 'Copied' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </Tooltip>

                  <Tooltip text="Edit" style={{ display: 'flex' }}>
                    <button
                      onClick={() => onEditMessage && onEditMessage(msg)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.color = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
                    </button>
                  </Tooltip>

                  {/* 🔥 VARIANTS SWITCHER */}
                  {(() => {
                      // Debugging variants rendering
                      let parsedVariants = null;
                      if (msg.variants) {
                          try {
                              parsedVariants = typeof msg.variants === 'string' ? JSON.parse(msg.variants) : msg.variants;
                          } catch(e) {}
                      }
                      
                      const showVariants = false; // parsedVariants && Array.isArray(parsedVariants) && parsedVariants.length > 0;
                      
                      if (showVariants) {
                          return (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0px',
                              color: '#6b7280',
                              fontSize: '12px',
                              fontWeight: 600,
                              userSelect: 'none',
                              marginLeft: '4px'
                            }}>
                              <button
                                onClick={() => {
                                    const maxIdx = parsedVariants.length;
                                    const current = selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : maxIdx;
                                    if (current > 0) setSelectedVersionIndex(prev => ({ ...prev, [msg.id]: current - 1 }));
                                }}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
                                    display: 'flex', alignItems: 'center', color: (selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : parsedVariants.length) > 0 ? '#6b7280' : '#d1d5db',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = (selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : parsedVariants.length) > 0 ? '#6b7280' : '#d1d5db'; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                              </button>
                              <span style={{ margin: '0 2px' }}>{(selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : parsedVariants.length) + 1}/{parsedVariants.length + 1}</span>
                              <button
                                onClick={() => {
                                    const maxIdx = parsedVariants.length;
                                    const current = selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : maxIdx;
                                    if (current < maxIdx) setSelectedVersionIndex(prev => ({ ...prev, [msg.id]: current + 1 }));
                                }}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
                                    display: 'flex', alignItems: 'center', color: (selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : parsedVariants.length) < parsedVariants.length ? '#6b7280' : '#d1d5db',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = (selectedVersionIndex[msg.id] !== undefined ? selectedVersionIndex[msg.id] : parsedVariants.length) < parsedVariants.length ? '#6b7280' : '#d1d5db'; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                              </button>
                            </div>
                          );
                      }
                      return null;
                  })()}
                </div>
              )}
            </div>
            {msg.role === 'assistant' && msg.text && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', paddingLeft: '48px' }}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCopyMessage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '12px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 500,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  {copyButtonText === 'Copied' ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                  <span>{copyButtonText}</span>
                </button>

                <button
                  onClick={() => {
                    if (onRegenerate) onRegenerate(msg.id);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '12px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 500,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>Retry</span>
                </button>
                {(() => {
                  const isApproved = approvedMsgIds.has(msg.id);
                  const isHovered = hoveredApprovedId === msg.id;

                  let btnText = "Approve";
                  let btnColor = '#6b7280';
                  let btnHoverColor = '#111827';
                  let icon = (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  );

                  if (isApproved) {
                    if (isHovered) {
                      btnText = "Revoke";
                      btnColor = '#ef4444';
                      btnHoverColor = '#dc2626';
                      icon = (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      );
                    } else {
                      btnText = "Sent to the next node";
                      btnColor = '#10b981';
                      btnHoverColor = '#10b981';
                      icon = (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      );
                    }
                  }

                  return (
                    <button
                      onClick={() => {
                        if (isApproved) {
                          const nextApproved = new Set(approvedMsgIds);
                          nextApproved.delete(msg.id);
                          setApprovedMsgIds(nextApproved);
                          setHoveredApprovedId(null);
                        } else {
                          const nextApproved = new Set(approvedMsgIds);
                          nextApproved.add(msg.id);
                          setApprovedMsgIds(nextApproved);
                          if (onApprove) onApprove(msg.text);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '12px',
                        color: btnColor,
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: isApproved ? 600 : 500,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = btnHoverColor;
                        if (isApproved) setHoveredApprovedId(msg.id);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = btnColor;
                        if (isApproved) setHoveredApprovedId(null);
                      }}
                    >
                      {icon}
                      <span>{btnText}</span>
                    </button>
                  );
                })()}


                {/* Assistant Pagination Switcher */}
                {(() => {
                  const isActuallySelectedOuter = msg.isSelection || msg.is_selection || 
                    (msg.role === 'assistant' && !!msg.text && messages.some(varMsg => 
                      varMsg.role === 'variants' && varMsg.selected_variant_content === msg.text
                    ));
                  if (assistantGroup && assistantGroup.length > 1 && !isBaselineAssistantMessage) {
                    const userMsg = messages.slice(0, indexInConversation).reverse().find(m => m.role === 'user');
                    const key = userMsg ? userMsg.id : 'default';
                    const activeIdx = selectedAssistantIndex[key] !== undefined ? selectedAssistantIndex[key] : (assistantGroup.findIndex(m => m.isSelection || m.is_selection || messages.some(varMsg => varMsg.role === 'variants' && varMsg.selected_variant_content === m.text)) !== -1 ? assistantGroup.findIndex(m => m.isSelection || m.is_selection || messages.some(varMsg => varMsg.role === 'variants' && varMsg.selected_variant_content === m.text)) : assistantGroup.length - 1);
                    
                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0px',
                        color: '#6b7280',
                        fontSize: '12px',
                        fontWeight: 600,
                        userSelect: 'none',
                        marginLeft: '12px'
                      }}>
                        <button
                          onClick={() => {
                            if (activeIdx > 0) {
                              setSelectedAssistantIndex(prev => ({ ...prev, [key]: activeIdx - 1 }));
                            }
                          }}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
                            display: 'flex', alignItems: 'center', color: activeIdx > 0 ? '#6b7280' : '#d1d5db',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => { if (activeIdx > 0) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = activeIdx > 0 ? '#6b7280' : '#d1d5db'; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <span style={{ margin: '0 2px' }}>{activeIdx + 1}/{assistantGroup.length}</span>
                        <button
                          onClick={() => {
                            if (activeIdx < assistantGroup.length - 1) {
                              setSelectedAssistantIndex(prev => ({ ...prev, [key]: activeIdx + 1 }));
                            }
                          }}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
                            display: 'flex', alignItems: 'center', color: activeIdx < assistantGroup.length - 1 ? '#6b7280' : '#d1d5db',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => { if (activeIdx < assistantGroup.length - 1) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = activeIdx < assistantGroup.length - 1 ? '#6b7280' : '#d1d5db'; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )
}, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.text === nextProps.msg.text &&
    prevProps.msg.role === nextProps.msg.role &&
    prevProps.msg.llmUsed === nextProps.msg.llmUsed &&
    prevProps.msg.sessionId === nextProps.msg.sessionId &&
    prevProps.msg.userRequest === nextProps.msg.userRequest &&
    prevProps.isProcessing === nextProps.isProcessing &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editText === nextProps.editText &&
    prevProps.profilePicture === nextProps.profilePicture &&
    prevProps.userEmail === nextProps.userEmail &&
    JSON.stringify(prevProps.msg.attachments) === JSON.stringify(nextProps.msg.attachments) &&
    JSON.stringify(prevProps.msg.variants) === JSON.stringify(nextProps.msg.variants) &&
    JSON.stringify(prevProps.selectedVersionIndex) === JSON.stringify(nextProps.selectedVersionIndex) &&
    JSON.stringify(prevProps.selectedAssistantIndex) === JSON.stringify(nextProps.selectedAssistantIndex) &&
    JSON.stringify(prevProps.assistantGroup) === JSON.stringify(nextProps.assistantGroup)
  );
});

const SafeAvatar = ({ src, name }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    console.log("SafeAvatar (ChatWindow) src changed:", src, "name:", name);
    setFailed(false);
  }, [src]);

  // No image — show initial letter on the (black) parent background
  if (!src || failed) {
    return (
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', userSelect: 'none' }}>
        {(name || 'U').charAt(0).toUpperCase()}
      </span>
    );
  }

  // Has image — render it slightly inset so the black ring stays visible
  return (
    <img
      src={src}
      alt={name}
      onError={() => {
        console.error("SafeAvatar (ChatWindow) failed to load src:", src);
        setFailed(true);
      }}
      style={{
        width: '88%',
        height: '88%',
        objectFit: 'cover',
        borderRadius: '4px',
        display: 'block',
        flexShrink: 0
      }}
    />
  );
};

export default function ChatWindow({ messages, onOpenFilePreview, currentConversationId, isSoftLocked, onShowPricing, isProcessing, onEditMessage, onCopyMessage, onRegenerate, onRegenerateVariant, onSaveEditedMessage, onCancelEdit, editingMessage, editText, setEditText, isLoadingConversation, profilePicture, userEmail, onNavigateToPrompts, onApprove, selectedAssistantIndex: externalSelectedAssistantIndex, setSelectedAssistantIndex: externalSetSelectedAssistantIndex }) {

  const chatWindowRef = useRef(null)
  // 🔥 NEW: Social media share state
  const [shareMenuOpen, setShareMenuOpen] = useState(null) // messageId or null
  const [connectedPlatforms, setConnectedPlatforms] = useState([])
  const [showTokensTooltip, setShowTokensTooltip] = useState(false)
  const [selectedVersionIndex, setSelectedVersionIndex] = useState({})
  const [_localSelectedAssistantIndex, _localSetSelectedAssistantIndex] = useState({})
  // Use external state if provided (lifted to App.jsx), else fall back to local
  const selectedAssistantIndex = externalSelectedAssistantIndex ?? _localSelectedAssistantIndex;
  const setSelectedAssistantIndex = externalSetSelectedAssistantIndex ?? _localSetSelectedAssistantIndex;

  const [localEditText, setLocalEditText] = useState('');
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [contentToPost, setContentToPost] = useState('');
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [showRedditModal, setShowRedditModal] = useState(false);
  const [approvedMsgIds, setApprovedMsgIds] = useState(new Set());
  const [hoveredApprovedId, setHoveredApprovedId] = useState(null);



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const userName = localStorage.getItem('userName') || 'User';


  // Handle share to social media - Smart redirect
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareMenuOpen && !e.target.closest('button')) {
        setShareMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [shareMenuOpen]);

  // 🔥 NEW: Fetch connected platforms
  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await fetch(`${API_BASE_URL}/api/accounts`, {
          headers: { 'user-id': userId }
        });

        if (response.ok) {
          const data = await response.json();
          setConnectedPlatforms(data.map(acc => acc.platform));
        }
      } catch (error) {
        console.error('Failed to fetch connected accounts:', error);
      }
    };

    fetchConnectedAccounts();
  }, []);



  // Handle share to social media - Smart redirect
  const handleShare = async (platform, messageContent) => {
    const isConnected = connectedPlatforms.includes(platform);

    if (!isConnected) {
      // Not connected - redirect to workflows
      setShareMenuOpen(null);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-publisher'));
      }, 500);
      return;
    }

    // Connected - store content and open modal
    setContentToPost(messageContent);
    setShareMenuOpen(null);

    // Open the appropriate modal
    if (platform === 'linkedin') setShowLinkedInModal(true);
    else if (platform === 'instagram') setShowInstagramModal(true);
    else if (platform === 'facebook') setShowFacebookModal(true);
    else if (platform === 'twitter') setShowTwitterModal(true);
    else if (platform === 'pinterest') setShowPinterestModal(true);
    else if (platform === 'reddit') setShowRedditModal(true);
  };


  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content)
    alert('Copied to clipboard!')
  }

  useEffect(() => {
    console.log('💬 ChatWindow received messages:', messages)
    messages.forEach((msg, idx) => {
      console.log(`Message ${idx}:`, {
        role: msg.role,
        hasAttachments: !!msg.attachments,
        attachments: msg.attachments,
        isArray: Array.isArray(msg.attachments)
      })
    })
  }, [messages])

  const isAtBottomRef = useRef(true);
  const prevMessagesLength = useRef(messages.length);
  const lastScrollTopRef = useRef(0);

  const handleScroll = () => {
    // Scroll tracking happens on the parent scroll container (owned by App.jsx)
    const scroller = chatWindowRef.current?.parentElement;
    if (scroller) {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      if (scrollTop < lastScrollTopRef.current) {
        isAtBottomRef.current = false;
      } else {
        isAtBottomRef.current = (scrollHeight - scrollTop - clientHeight) < 50;
      }
      lastScrollTopRef.current = scrollTop;
    }
  };

  useEffect(() => {
    const messagesLengthChanged = messages.length !== prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    const scroller = chatWindowRef.current?.parentElement;
    if (scroller) {
      if (messagesLengthChanged || isAtBottomRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    }
  }, [messages]);






  const hasChatMessages = (messages || []).some(m => m.role !== 'status');

  return (
    <div className="chat-window" ref={chatWindowRef} onScroll={handleScroll} style={{
      marginTop: '0',
      padding: !hasChatMessages ? '0' : '20px 20px 300px 20px',
      background: 'transparent',
      border: 'none',
      overflowY: 'visible',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      position: 'relative',
      zIndex: 2
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Show loading spinner when conversation is loading */}
      {isLoadingConversation ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, rgba(17, 24, 39, 0) 0%, rgba(17, 24, 39, 1) 100%)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px'
          }} />
          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
            Loading conversation...
          </div>
        </div>
      ) : !hasChatMessages && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
          zIndex: 10
        }}>
          
          <h1 style={{
            fontSize: '30px',
            fontWeight: 500,
            color: (() => {
              try {
                return localStorage.getItem("studio-theme") === "dark" ? "#ffffff" : "#16192b";
              } catch (_) {
                return "#16192b";
              }
            })(),
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginTop: 0,
            marginBottom: '12px',
            fontFamily: '"Inter Tight", Inter, system-ui, sans-serif'
          }}>
            {getGreeting()} {userName}
          </h1>
          {isIncognitoMode && (
            <p style={{
              fontSize: '18px',
              fontWeight: 600,
              color: (() => {
                try {
                  return localStorage.getItem("studio-theme") === "dark" ? "#ffffff" : "#111827";
                } catch (_) {
                  return "#111827";
                }
              })(),
              lineHeight: '1.5',
              margin: '0 0 12px 0',
              fontFamily: '"Inter Tight", Inter, system-ui, sans-serif'
            }}>
              You've gone Incognito
            </p>
          )}
          <p style={{
            fontSize: '14.5px',
            color: (() => {
              try {
                return localStorage.getItem("studio-theme") === "dark" ? "#b4ada2" : "#4b5563";
              } catch (_) {
                return "#4b5563";
              }
            })(),
            lineHeight: '1.5',
            margin: '0 0 2px 0'
          }}>
            Type in the composer to get started.
          </p>
          <p style={{
            fontSize: '14.5px',
            color: (() => {
              try {
                return localStorage.getItem("studio-theme") === "dark" ? "#b4ada2" : "#4b5563";
              } catch (_) {
                return "#4b5563";
              }
            })(),
            lineHeight: '1.5',
            margin: '0 0 20px 0'
          }}>
            Cant decide? Select a prompt from the <span 
              onClick={onNavigateToPrompts} 
              style={{ 
                color: (() => {
                  try {
                    return localStorage.getItem("studio-theme") === "dark" ? "#5ca2ff" : "#2563eb";
                  } catch (_) {
                    return "#2563eb";
                  }
                })(),
                cursor: 'pointer', 
                fontWeight: 500 
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >Prompts Library</span>
          </p>
        </div>
      )}

      {hasChatMessages && (
        <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {messages.map((msg, index) => {
            let group = [];
            let groupIsBaseline = false;
            
            if (msg.role === 'assistant' || msg.role === 'variants') {
              // Find preceding user message index
              let startIdx = 0;
              for (let i = index; i >= 0; i--) {
                if (messages[i].role === 'user') {
                  startIdx = i + 1;
                  break;
                }
              }
              // Find next user message index
              let endIdx = messages.length;
              for (let i = index; i < messages.length; i++) {
                if (messages[i].role === 'user') {
                  endIdx = i;
                  break;
                }
              }
              const segment = messages.slice(startIdx, endIdx);
              group = segment.filter(m => m.role === 'assistant');
              
              if (group.length > 0) {
                const firstMsgInGroup = group[0];
                const idxOfFirst = messages.findIndex(m => m.id === firstMsgInGroup.id);
                
                let prevIdx = idxOfFirst - 1;
                while (prevIdx >= 0 && messages[prevIdx].role === 'status') {
                  prevIdx--;
                }
                
                if (prevIdx >= 0 && messages[prevIdx].role === 'variants') {
                  groupIsBaseline = true;
                }
              }
              
              if (group.length > 1) {
                // Use first message in group to find preceding user — same method as pagination key
                const firstInGroup = group[0];
                const firstInGroupIdx = messages.findIndex(m => m.id === firstInGroup.id);
                const userMsg = messages.slice(0, firstInGroupIdx).reverse().find(m => m.role === 'user');
                const key = userMsg ? userMsg.id : 'default';
                let activeIdx = selectedAssistantIndex[key];
                if (activeIdx === undefined) {
                  const selIdx = group.findIndex(m => m.isSelection || m.is_selection || messages.some(varMsg => varMsg.role === 'variants' && varMsg.selected_variant_content === m.text));
                  activeIdx = selIdx !== -1 ? selIdx : group.length - 1;
                }
                if (msg.role === 'assistant' && group[activeIdx]?.id !== msg.id) {
                  return null;
                }
              }
            }

            return (
              <MessageItem
                key={msg.id}
                msg={msg}
                messages={messages}
                selectedVersionIndex={selectedVersionIndex}
                setSelectedVersionIndex={setSelectedVersionIndex}
                selectedAssistantIndex={selectedAssistantIndex}
                setSelectedAssistantIndex={setSelectedAssistantIndex}
                assistantGroup={group}
                isBaselineAssistantMessage={groupIsBaseline}
                indexInConversation={index}
                approvedMsgIds={approvedMsgIds}
                setApprovedMsgIds={setApprovedMsgIds}
                hoveredApprovedId={hoveredApprovedId}
                setHoveredApprovedId={setHoveredApprovedId}
                onShowPricing={onShowPricing}
                onOpenFilePreview={onOpenFilePreview}
                onToggleShareMenu={() => setShareMenuOpen(shareMenuOpen === msg.id ? null : msg.id)}
                onShare={(platform) => handleShare(platform, msg.text)}
                isProcessing={
                  isProcessing && 
                  (msg.role === 'assistant' || msg.role === 'variants') && 
                  !messages.slice(index + 1).some(m => m.role === 'assistant' || m.role === 'variants')
                }
                isLocked={index < messages.length - 1 && messages.slice(index + 1).some(m => m.role === 'user')}
                onEditMessage={onEditMessage}
                onCopyMessage={onCopyMessage}
                isEditing={editingMessage && editingMessage.id === msg.id}
                onSaveEdit={onSaveEditedMessage}
                onCancelEdit={onCancelEdit}
                editText={editText}
                setEditText={setEditText}
                onRegenerate={() => {
                  console.log('🔄 [Regenerate] Triggered for assistant message. Index:', index, 'msg:', msg);
                  
                  // 🔥 NEW: Check if this is a Retry on an AI Arena baseline selection!
                  const prevMsg = messages[index - 1];
                  if ((msg.isSelection || msg.is_selection) && prevMsg && prevMsg.role === 'variants') {
                      let selectedLlm = null;
                      if (Array.isArray(prevMsg.variants)) {
                          const winner = prevMsg.variants.find(v => v.is_selected);
                          if (winner) selectedLlm = winner.llm_name;
                      } else if (typeof prevMsg.variants === 'string') {
                          try {
                              const parsed = JSON.parse(prevMsg.variants);
                              const winner = parsed.find(v => v.is_selected);
                              if (winner) selectedLlm = winner.llm_name;
                          } catch(e) {}
                      }
                      
                      if (selectedLlm && prevMsg.sessionId) {
                          console.log('🔄 [RegenerateVariant] Regenerating specific AI Arena variant:', selectedLlm);
                          if (onRegenerateVariant) onRegenerateVariant(prevMsg.sessionId, selectedLlm);
                          return; // Do NOT do a full history rewrite!
                      }
                  }

                  // Normal regeneration logic (full history rewrite)
                  if (onRegenerate) {
                    onRegenerate(msg.id);
                  }
                }}
                 profilePicture={profilePicture}
                 userEmail={userEmail}
                 onApprove={onApprove}
               />
            );
          })}
        </div>
      )}


      {/* Social Media Post Modals */}
      <LinkedInPostModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        initialContent={contentToPost}
      />

      <InstagramPostModal
        isOpen={showInstagramModal}
        onClose={() => setShowInstagramModal(false)}
        initialContent={contentToPost}
      />

      <FacebookPostModal
        isOpen={showFacebookModal}
        onClose={() => setShowFacebookModal(false)}
        initialContent={contentToPost}
      />

      <TwitterPostModal
        isOpen={showTwitterModal}
        onClose={() => setShowTwitterModal(false)}
        initialContent={contentToPost}
      />

      <PinterestPostModal
        isOpen={showPinterestModal}
        onClose={() => setShowPinterestModal(false)}
        initialContent={contentToPost}
      />

      <RedditPostModal
        isOpen={showRedditModal}
        onClose={() => setShowRedditModal(false)}
        initialContent={contentToPost}
      />
    </div>
  )
}