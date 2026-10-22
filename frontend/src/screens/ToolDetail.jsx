/**
 * ToolDetail — Copy Agent (Live)
 * -------------------------------------------------------
 * This is the only screen wired to a real backend.
 * All requests go to POST /bff/chat/completions (proxied to copyagennt.in).
 * Supports both JSON and SSE streaming modes.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles, Plus, Check, ArrowRight, RefreshCw, Copy as CopyIcon,
  Send, X, Loader2,
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { BRAND, COPY_TEMPLATES, toolById } from "../data.js";
import { Card, Btn, Chip, Mono, Eyebrow } from "../components/primitives/index.jsx";

import PromptsModal from "../components/copy_node_ui/PromptsModal.jsx";
import ChatWindow from "../components/copy_node_ui/ChatWindow.jsx";
import InputBar from "../components/copy_node_ui/InputBar.jsx";
import { PROMPTS_DATA, getPromptIconInfo } from "../utils/promptsData.js";
import PromptMockup from "../components/copy_node_ui/PromptMockup.jsx";

const BFF_ENDPOINT = "/bff/chat/completions";

// ── Default prompt seed ───────────────────────────────────
const DEFAULT_PROMPT = `Write 3 Instagram captions for the Spring Drop — lightweight technical outerwear for city commutes. Angle: beat the weather without looking like you're dressed for it.`;

export default function ToolDetail({ t, nav, showToast, goToLibrarySignal }) {
  const tool = toolById("copy");

  // ── UI State ──────────────────────────────────────────
  const [template, setTemplate] = useState("Instagram Captions");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [useStream, setUseStream] = useState(true);
  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // Two-page view flow
  const [view, setView] = useState("library"); // "library" or "chat"
  const [searchTerm, setSearchTerm] = useState('');
  const [navPath, setNavPath] = useState({ category: null, subcategory: null });

  const getAllPrompts = () => {
    const flatPrompts = [];
    if (!PROMPTS_DATA) return flatPrompts;
    Object.entries(PROMPTS_DATA).forEach(([key, list]) => {
      if (!Array.isArray(list)) return;
      list.forEach(p => {
        if (!p) return;
        let cat = p.category || '';
        let sub = p.subcategory || '';
        const titleLower = (p.title || '').toLowerCase();

        // 1. Social Media
        if (key === 'social-media') {
          cat = 'Social & Messaging';
          if (['instagram', 'reel', 'story', 'carousel', 'bio', 'contest'].some(w => titleLower.includes(w))) {
            sub = 'Instagram';
          } else if (['linkedin', 'article', 'thought leadership', 'company update', 'poll'].some(w => titleLower.includes(w))) {
            sub = 'LinkedIn';
          } else if (titleLower.includes('facebook')) {
            sub = 'Facebook';
          } else if (['tiktok', 'hook'].some(w => titleLower.includes(w))) {
            sub = 'TikTok';
          } else if (['twitter', 'thread', 'space'].some(w => titleLower.includes(w))) {
            sub = 'Twitter/X';
          } else if (['youtube', 'shorts'].some(w => titleLower.includes(w))) {
            sub = 'YouTube';
          } else if (titleLower.includes('whatsapp')) {
            sub = 'WhatsApp';
          } else {
            sub = 'Utility';
          }
        }
        // 2. WhatsApp
        else if (key === 'whatsapp-marketing') {
          cat = 'Social & Messaging';
          sub = 'WhatsApp';
        }
        // 3. Paid Ads
        else if (key === 'paid-advertising') {
          cat = 'Ads & Paid Media';
          sub = 'General';
        }
        // 4. Email
        else if (key === 'email-marketing') {
          cat = 'Email';
          if (['aida', 'pas', 'fab', 'subject', 'attention', 'pain', 'features'].some(w => titleLower.includes(w))) {
            sub = 'Frameworks';
          } else if (['welcome', 'abandoned', 'transactional', 'reminder', 'post-purchase', 'feedback', 'replay', 'survey'].some(w => titleLower.includes(w))) {
            sub = 'Lifecycle/Transactional';
          } else {
            sub = 'Campaign/Marketing';
          }
        } else if (key === 'edm-email-design') {
          cat = 'Email';
          sub = 'Campaign/Marketing';
        }
        // 5. Website & Content
        else if (key === 'website-product-copy') {
          cat = 'Website & Content';
          if (['article', 'blog', 'rewrite', 'seo', 'keyword', 'summary', 'guide', 'faq'].some(w => titleLower.includes(w))) {
            sub = 'SEO & Content';
          } else if (['landing', 'hero', 'about', 'product page', 'pricing', 'shipping'].some(w => titleLower.includes(w))) {
            sub = 'Web Pages';
          } else {
            sub = 'Product Copy';
          }
        } else if (key === 'content-repurposing') {
          cat = 'Website & Content';
          sub = 'Repurposing';
        }
        // 6. Business & Sales
        else if (key === 'sales-business-development') {
          cat = 'Business & Sales';
          if (['outreach', 'cold email', 'follow-up', 'inmail'].some(w => titleLower.includes(w))) {
            sub = 'Outreach & Cold Email';
          } else if (['boolean', 'prospect', 'connection'].some(w => titleLower.includes(w))) {
            sub = 'LinkedIn (Sales)';
          } else {
            sub = 'Sales Process';
          }
        } else if (key === 'brand-strategy') {
          cat = 'Business & Sales';
          sub = 'Brand Identity';
        } else if (key === 'public-relations') {
          cat = 'Business & Sales';
          sub = 'PR & Press';
        } else if (key === 'recruiting') {
          cat = 'Business & Sales';
          sub = 'Recruiting';
        }
        // 7. Creative & Multimedia
        else if (key === 'video-audio-content') {
          cat = 'Creative & Multimedia';
          sub = 'Video & Audio';
        } else if (key === 'creative-captions') {
          cat = 'Creative & Multimedia';
          if (titleLower.includes('creative copy')) {
            sub = 'Digital Creative Formats';
          } else {
            sub = 'Utilities';
          }
        } else if (key === 'print-offline-extended') {
          cat = 'Creative & Multimedia';
          sub = 'Print & Offline';
        } else if (key === 'ux-microcopy') {
          cat = 'Website & Content';
          sub = 'UX & System Copy';
        } else if (key === 'additional') {
          cat = 'Creative & Multimedia';
          sub = 'Utilities';
        }

        let finalTitle = p.title || '';
        if (finalTitle === 'Linkedin Boolean Search') finalTitle = 'LinkedIn Boolean Search';
        if (finalTitle === 'Linkedin Connection Invite Message') finalTitle = 'LinkedIn Connection Invite Message';
        if (finalTitle === 'Youtube Video Description') finalTitle = 'YouTube Video Description';

        const iconInfo = getPromptIconInfo ? getPromptIconInfo(finalTitle) : { cls: 'ic-generic', icon: 'ti-layout-grid' };

        flatPrompts.push({
          ...p,
          title: finalTitle,
          prompt: p.description || p.prompt || '',
          category: cat,
          subcategory: sub,
          tag: cat,
          iconClass: iconInfo.cls,
          icon: iconInfo.icon,
          uses: '12 uses'
        });
      });
    });
    return flatPrompts;
  };

  const getFilteredPrompts = () => {
    let filtered = [];
    const searchVal = (searchTerm || '').trim().toLowerCase();

    if (navPath.category === null) {
      if (searchVal) {
        filtered = getAllPrompts().filter(item => {
          if (!item) return false;
          return (item.title || '').toLowerCase().includes(searchVal) || 
                 (item.category || '').toLowerCase().includes(searchVal) ||
                 (item.subcategory || '').toLowerCase().includes(searchVal);
        });
      } else {
        const recentKeys = [
          { sub: "Instagram", title: "Instagram Captions" },
          { sub: "LinkedIn", title: "LinkedIn Post" },
          { sub: "Lifecycle/Transactional", title: "Welcome Email Series (3 emails)" },
          { sub: "SEO & Content", title: "Blog Outline" },
          { sub: "Facebook", title: "Facebook Organic Post" },
          { sub: "TikTok", title: "TikTok Script" }
        ];
        filtered = recentKeys.map(key => {
          return getAllPrompts().find(item => 
            item && 
            (item.subcategory || '').toLowerCase() === (key.sub || '').toLowerCase() && 
            item.title === key.title
          );
        }).filter(Boolean);
      }
    } else {
      const catMapping = {
        'Social & Messaging': 'Social Media',
        'Ads & Paid Media': 'Ads & Paid Media',
        'Email': 'Email',
        'Website & Content': 'Website & Content',
        'Business & Sales': 'Business & Sales',
        'Creative & Multimedia': 'Creative & Multimedia',
        'social-media': 'Social Media',
        'email-marketing': 'Email'
      };
      
      const mappedCat = catMapping[navPath.category] || navPath.category;
      
      filtered = getAllPrompts().filter(item => {
        if (!item) return false;
        let cat = item.category || '';
        if (cat === "Social & Messaging") cat = "Social Media";
        const categoryMatches = !mappedCat || (cat === mappedCat);
        
        let subcategoryMatches = true;
        if (navPath.subcategory && navPath.subcategory !== 'Popular') {
          subcategoryMatches = ((item.subcategory || '').toLowerCase() === (navPath.subcategory || '').toLowerCase());
        }
        
        const searchMatches = (!searchVal || 
                               (item.title || '').toLowerCase().includes(searchVal) || 
                               (item.category || '').toLowerCase().includes(searchVal) ||
                               (item.subcategory || '').toLowerCase().includes(searchVal));
                               
        return categoryMatches && subcategoryMatches && searchMatches;
      });

      if (navPath.subcategory === 'Popular' || !navPath.subcategory) {
        if (mappedCat === 'Social Media') {
          const popularSocialKeys = [
            { sub: "Instagram", title: "Instagram Captions" },
            { sub: "LinkedIn", title: "LinkedIn Post" },
            { sub: "Facebook", title: "Facebook Organic Post" },
            { sub: "TikTok", title: "TikTok Script" },
            { sub: "Twitter/X", title: "Twitter Engagement Tweet" },
            { sub: "Twitter/X", title: "Twitter Thread" },
            { sub: "YouTube", title: "YouTube Video Description" },
            { sub: "WhatsApp", title: "WhatsApp Broadcast Message (Promotional)" }
          ];
          filtered = popularSocialKeys.map(key => {
            return getAllPrompts().find(item => {
              if (!item) return false;
              let cat = item.category || '';
              if (cat === 'Social & Messaging') cat = 'Social Media';
              return cat === 'Social Media' && 
                     (item.subcategory || '').toLowerCase() === (key.sub || '').toLowerCase() && 
                     item.title === key.title;
            });
          }).filter(Boolean);

          if (searchVal) {
            filtered = filtered.filter(item => item && (item.title || '').toLowerCase().includes(searchVal));
          }
        } else {
          filtered = getAllPrompts().filter(item => {
            if (!item) return false;
            let cat = item.category || '';
            if (cat === 'Social & Messaging') cat = 'Social Media';
            const categoryMatches = (cat === mappedCat);
            const searchMatches = (!searchVal || (item.title || '').toLowerCase().includes(searchVal));
            return categoryMatches && searchMatches;
          }).slice(0, 5);
        }
      }
    }
    return filtered;
  };

  const handlePromptSelect = (promptItem) => {
    const desc = promptItem.prompt || promptItem.description;
    const title = promptItem.title;
    setView("chat");
    setTimeout(() => {
      inputBarRef.current?.setTemplate(desc, title);
      setPrompt(desc);
      setTemplate(title);
    }, 100);
  };

  const renderSubcategoryBar = () => {
    if (!navPath.category) return null;

    const catMapping = {
      'Social & Messaging': 'Social & Messaging',
      'Social Media': 'Social & Messaging',
      'Ads & Paid Media': 'Ads & Paid Media',
      'Email': 'Email',
      'Website & Content': 'Website & Content',
      'Business & Sales': 'Business & Sales',
      'Creative & Multimedia': 'Creative & Multimedia',
    };
    const allPrompts = getAllPrompts();
    const subcatSet = new Set();
    
    const mappedCat = catMapping[navPath.category] || navPath.category;
    allPrompts.forEach(p => {
      if (p && p.category === mappedCat && p.subcategory) {
        subcatSet.add(p.subcategory);
      }
    });

    const preferredOrder = {
      'Social & Messaging': ['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'Twitter/X', 'YouTube', 'WhatsApp', 'Utility'],
      'Social Media': ['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'Twitter/X', 'YouTube', 'WhatsApp', 'Utility'],
      'Email': ['Campaign/Marketing', 'Frameworks', 'Lifecycle/Transactional'],
      'Website & Content': ['SEO & Content', 'Web Pages', 'Product Copy', 'UX & System Copy', 'Repurposing'],
      'Business & Sales': ['Outreach & Cold Email', 'LinkedIn (Sales)', 'Sales Process', 'Brand Identity', 'PR & Press'],
      'Creative & Multimedia': ['Video & Audio', 'Digital Creative Formats', 'Print & Offline', 'Utilities'],
    };
    const orderList = preferredOrder[navPath.category] || preferredOrder[mappedCat] || [];
    const subcats = [
      ...orderList.filter(s => subcatSet.has(s)),
      ...Array.from(subcatSet).filter(s => !orderList.includes(s)).sort()
    ];

    const subIcons = {
      'Instagram': <svg className="w-3.5 h-3.5 text-pink-600 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
      'LinkedIn': <svg className="w-3.5 h-3.5 text-blue-700 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>,
      'Facebook': <svg className="w-3.5 h-3.5 text-blue-600 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>,
      'TikTok': <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z"/></svg>,
      'Twitter/X': <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      'YouTube': <svg className="w-3.5 h-3.5 text-red-600 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
      'WhatsApp': <svg className="w-3.5 h-3.5 text-emerald-500 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path fillRule="evenodd" d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.25 8.477 3.517 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.414 9.863-9.847.002-2.63-1.023-5.101-2.887-6.968a9.821 9.821 0 0 0-6.98-2.87c-5.441 0-9.867 4.417-9.871 9.851-.002 1.764.464 3.486 1.353 5.023l-.995 3.636 3.731-.98zm11.368-6.406c-.312-.156-1.85-.913-2.137-1.017-.287-.104-.497-.156-.705.156-.208.312-.807.104-.989.312-.18.208-.363.234-.675.078-.312-.156-1.316-.485-2.507-1.548-.927-.827-1.553-1.85-1.735-2.16-.182-.313-.02-.482.136-.638.14-.14.312-.365.468-.547.156-.182.208-.313.312-.52.104-.208.052-.39-.026-.547-.079-.156-.705-1.7-.965-2.327-.253-.61-.51-.527-.705-.537-.182-.01-.39-.012-.6-.012s-.552.078-.84.39c-.287.312-1.1.104-1.1 2.688s1.862 5.078 2.122 5.424c.26.347 3.663 5.594 8.89 7.854 1.244.538 2.215.86 2.973 1.1 1.25.397 2.39.342 3.29.208.999-.149 2.137-.872 2.438-1.717.3-.844.3-1.568.21-1.717-.09-.15-.333-.254-.645-.41z"/></svg>,
      'Utility': <svg className="w-3.5 h-3.5 text-gray-500 fill-current" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>,
    };

    if (subcats.length === 0) return null;

    return (
      <div className="flex w-full mb-0 items-center justify-start gap-0 overflow-x-auto scrollbar-none select-none" style={{ gap: '0px', borderBottom: `1px solid ${t.border}` }}>
        <button
          onClick={() => setNavPath({ ...navPath, subcategory: 'Popular' })}
          className="px-4 py-2 text-xs focus:outline-none shrink-0 -mb-px bg-transparent"
          style={{ 
            border: 'none', 
            borderBottom: (navPath.subcategory === 'Popular' || !navPath.subcategory) 
              ? `3px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` 
              : '3px solid transparent',
            color: (navPath.subcategory === 'Popular' || !navPath.subcategory) ? t.text : t.text3,
            fontWeight: (navPath.subcategory === 'Popular' || !navPath.subcategory) ? 700 : 600,
            paddingBottom: '8px',
            borderRadius: '0px',
            outline: 'none',
            boxShadow: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            if (navPath.subcategory !== 'Popular' && navPath.subcategory) e.currentTarget.style.color = t.text;
          }}
          onMouseLeave={(e) => {
            if (navPath.subcategory !== 'Popular' && navPath.subcategory) e.currentTarget.style.color = t.text3;
          }}
        >
          Popular
        </button>
        {subcats.map(sub => {
          const isActive = navPath.subcategory === sub;
          return (
            <button
              key={sub}
              onClick={() => setNavPath({ ...navPath, subcategory: sub })}
              className="px-4 py-2 text-xs flex items-center gap-1.5 focus:outline-none shrink-0 -mb-px bg-transparent"
              style={{ 
                border: 'none', 
                borderBottom: isActive 
                  ? `3px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` 
                  : '3px solid transparent',
                color: isActive ? t.text : t.text3,
                fontWeight: isActive ? 700 : 600,
                paddingBottom: '8px',
                borderRadius: '0px',
                outline: 'none',
                boxShadow: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = t.text;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = t.text3;
              }}
            >
              {subIcons[sub] || null}
              <span>{sub}</span>
            </button>
          );
        })}
      </div>
    );
  };


  // ── Generation state ──────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [hasOutput, setHasOutput] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [approved, setApproved] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState("claude-4-sonnet");

  const abortRef = useRef(null);
  const inputBarRef = useRef(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [chatFilter, setChatFilter] = useState("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editChatTitle, setEditChatTitle] = useState("");
  const [hoveredChatId, setHoveredChatId] = useState(null);

  const fetchRecentChats = async () => {
    setLoadingChats(true);
    try {
      const resp = await fetch("/bff/chat/conversations");
      if (resp.ok) {
        const data = await resp.json();
        const chats = Array.isArray(data) ? data : (data.conversations || []);
        setRecentChats(chats);
      }
    } catch (e) {
      console.error("Failed to fetch recent chats:", e);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadConversation = async (convId) => {
    showToast("Loading chat...");
    try {
      const resp = await fetch(`/bff/chat/conversations/${convId}`);
      if (resp.ok) {
        const data = await resp.json();
        setConversationId(data.id || convId);
        const mapped = (data.messages || []).map(m => ({
          id: m.id || (Date.now().toString() + Math.random()),
          role: m.role || 'assistant',
          text: m.text || m.content || '',
        }));
        setMessages(mapped);
        setView("chat");
        showToast("Chat loaded");
      }
    } catch (e) {
      console.error("Failed to load conversation details:", e);
      showToast("Failed to load chat");
    }
  };

  const handleDeleteChat = async (convId) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      const resp = await fetch(`/bff/chat/conversations/${convId}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        showToast("Chat deleted");
        setRecentChats(prev => prev.filter(c => c.id !== convId));
      }
    } catch (e) {
      console.error("Failed to delete chat:", e);
      showToast("Failed to delete chat");
    }
  };

  const handleSaveTitle = async (convId) => {
    if (!editChatTitle.trim()) return;
    try {
      const resp = await fetch(`/bff/chat/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editChatTitle.trim() }),
      });
      if (resp.ok) {
        setRecentChats(prev => prev.map(c => c.id === convId ? { ...c, title: editChatTitle.trim() } : c));
        showToast("Title updated");
      } else {
        showToast("Failed to update title");
      }
    } catch (e) {
      console.error("Failed to update title:", e);
      showToast("Failed to update title");
    } finally {
      setEditingChatId(null);
    }
  };

  const timeSince = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return "—";
    }
  };

  const filteredChats = recentChats.filter(chat => {
    const term = chatSearchTerm.toLowerCase();
    const titleMatch = (chat.title || "").toLowerCase().includes(term);
    const projectMatch = (chat.project_name || chat.projectName || "").toLowerCase().includes(term);
    const userMatch = (localStorage.getItem("userName") || "Anoop Dixit").toLowerCase().includes(term);
    return titleMatch || projectMatch || userMatch;
  });

  useEffect(() => {
    const scroller = document.getElementById("studio-scroll");
    if (scroller) {
      scroller.style.overflowY = "auto";
    }
    // Notify TopBar to show/hide New Chat button
    window.dispatchEvent(new CustomEvent("tool-chat-view-change", { detail: { isChat: view === "chat" } }));
  }, [view]);

  // ── New Chat Session Event Listener ───────────────────
  useEffect(() => {
    const handleNewChat = () => {
      setConversationId(null);
      setMessages([]);
      setView("chat");
      inputBarRef.current?.setText?.("");
      setPrompt("");
      setTemplate("");
    };
    window.addEventListener("new-chat-session", handleNewChat);
    return () => {
      window.removeEventListener("new-chat-session", handleNewChat);
    };
  }, []);

  // ── Navigate back to library from TopBar breadcrumb ──
  useEffect(() => {
    const handleNavLibrary = () => setView("library");
    window.addEventListener("tool-navigate-library", handleNavLibrary);
    return () => window.removeEventListener("tool-navigate-library", handleNavLibrary);
  }, []);

  useEffect(() => {
    if (goToLibrarySignal > 0) {
      setView("library");
    }
  }, [goToLibrarySignal]);

  // ── Chat State Handlers ──────────────────────────────
  const handleSendMessage = useCallback((role, text, attachments = null, messageId = null, selectedLLMName = null, options = null) => {
    setMessages(prev => [
      ...prev,
      {
        id: messageId || (Date.now().toString() + Math.random()),
        role: role,
        text: text,
        attachments: attachments,
        llm_name: selectedLLMName,
        ...options
      }
    ]);
  }, []);

  const handleUpdateLastMessage = useCallback((text) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].text = text;
        } else if (text && text.startsWith("Error:")) {
          newMessages.push({
            id: Date.now().toString() + Math.random(),
            role: 'assistant',
            text: text
          });
        }
      }
      return newMessages;
    });
  }, []);

  const handleUpdateLastMessageId = useCallback((messageId) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages[newMessages.length - 1].id = messageId;
      }
      return newMessages;
    });
  }, []);

  // ── Regenerate (retry/regenerate message) ────────────
  const regenerate = (messageId) => {
    let userMessageText = "";
    let targetMsgIdx = -1;
    
    if (messageId && messages.length > 0) {
      targetMsgIdx = messages.findIndex(m => m.id === messageId);
      if (targetMsgIdx !== -1) {
        // Find preceding user message
        for (let i = targetMsgIdx - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            userMessageText = messages[i].text;
            break;
          }
        }
      }
    }
    
    // Fallback to the last user message
    if (!userMessageText) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        userMessageText = lastUserMsg.text;
      }
    }
    
    // Final fallback to the parent prompt state
    if (!userMessageText) {
      userMessageText = prompt;
    }
    
    if (!userMessageText || !userMessageText.trim()) return;

    // Delete all messages from the preceding user message onwards
    if (targetMsgIdx !== -1) {
      let userIdx = -1;
      for (let i = targetMsgIdx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userIdx = i;
          break;
        }
      }
      if (userIdx !== -1) {
        setMessages(prev => prev.slice(0, userIdx));
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    
    // Call submitGeneration on InputBar with the user message text
    if (inputBarRef.current) {
      inputBarRef.current.submitGeneration(userMessageText);
    }
  };

  // ── Copy to clipboard ─────────────────────────────────
  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      showToast("Copy failed — please select manually");
    }
  };

  // ── Approve ───────────────────────────────────────────
  const handleApprove = () => {
    setApproved(true);
    showToast("Approved — saved to Assets & fed back to Brand Brain");
  };

  return (
    <div style={{
      maxWidth: view === "chat" ? "none" : 1180,
      margin: "0 auto",
      padding: view === "chat" ? "10px 0 10px" : "32px 40px 80px",
      fontFamily: FONT,
      height: "auto",
      display: view === "chat" ? "flex" : "block",
      flexDirection: "column",
      boxSizing: "border-box"
    }}>
      {/* Header */}
      {view === "library" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div 
              onClick={() => {
                setNavPath({ category: null, subcategory: null });
                setSearchTerm("");
              }}
              style={{ 
                fontFamily: FONT, 
                fontWeight: 700, 
                fontSize: 24, 
                letterSpacing: "-.02em", 
                color: t.text, 
                cursor: "pointer",
                userSelect: "none"
              }}
              onMouseEnter={(e) => e.target.style.opacity = 0.8}
              onMouseLeave={(e) => e.target.style.opacity = 1}
            >
              Prompts Library
            </div>
            <div style={{
              fontSize: 12.5,
              color: t.text3,
              fontFamily: FONT,
              fontWeight: 400,
              letterSpacing: "0em"
            }}>
              Explore and run high-performing copywriting prompts.
            </div>
          </div>
          <button
            onClick={() => nav("tools")}
            style={{
              marginLeft: "auto", fontFamily: MONO, fontSize: 11.5, color: t.text2,
              background: t.surface2, border: `1px solid ${t.border}`, borderRadius: R.pill,
              padding: "5px 12px", cursor: "pointer",
            }}
          >
            ← Back to tools
          </button>
        </div>
      )}

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: view === "chat" ? 0 : 20,
        flex: view === "chat" ? 1 : "none",
        height: "auto"
      }}>
        {view === "library" ? (
          <div style={{ background: t.bg === "#151311" ? t.surface : "#ffffff", border: `1px solid ${t.border}`, borderRadius: R.md, overflow: "hidden", minHeight: 400, padding: '24px' }}>
            {/* Style injection for prompt cards */}
            <style>{`
              .prompt-card { transition: all 0.2s; }
              .prompt-card:hover { transform: translateY(-2px); }
              .prompt-card > div {
                border: 1px solid ${t.border} !important;
                border-radius: 0px !important;
              }
              .prompt-card:hover > div {
                border-color: ${t.text3} !important;
              }
              .prompt-category-btn {
                transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out, transform 0.2s ease-in-out !important;
                cursor: pointer !important;
              }
              .prompt-category-btn:hover {
                border-color: ${t.borderStrong} !important;
                background-color: ${t.bg === "#151311" ? t.surface3 : "rgba(0,0,0,.02)"} !important;
                transform: translateY(-2px);
              }
              .prompt-category-btn.is-active,
              .prompt-category-btn.is-active:hover {
                border-bottom: 2px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"} !important;
                background-color: ${t.bg === "#151311" ? t.surface2 : "#ffffff"} !important;
              }
            `}</style>

            {/* Search bar + Write your own button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mb-6">
              <div className="relative w-full" style={{ maxWidth: '280px' }}>
                <span style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', pointerEvents: 'none', color: t.text3 }}>
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input 
                  type="text" 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  value={searchTerm} 
                  placeholder="Search templates..." 
                  className="w-full py-2 border text-sm focus:outline-none" 
                  style={{ 
                    paddingLeft: '36px',
                    paddingRight: '12px',
                    borderRadius: '0px',
                    border: `1.5px solid ${t.border}`,
                    background: t.bg === "#151311" ? t.bg : "#ffffff",
                    color: t.text,
                    boxShadow: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = t.bg === "#151311" ? "#ffffff" : "#000000";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = t.border;
                  }}
                />
              </div>
              
              <button
                onClick={() => setView("chat")}
                className="px-5 py-2 text-sm font-semibold transition-colors shrink-0"
                style={{
                  borderRadius: '0px',
                  border: 'none',
                  cursor: 'pointer',
                  background: t.bg === "#151311" ? "#ffffff" : "#000000",
                  color: t.bg === "#151311" ? "#000000" : "#ffffff",
                  fontFamily: '"Inter Tight", Inter, system-ui, sans-serif'
                }}
              >
                Write your own →
              </button>
            </div>

            {/* 6 Category cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 w-full px-0 py-2 mb-6">
              <button 
                onClick={() => setNavPath({ category: 'Social Media', subcategory: 'Popular' })} 
                className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Social Media' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden shadow-sm`}
                style={{
                  border: `1px solid ${t.border}`,
                  borderBottom: navPath.category === 'Social Media' ? `2px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` : `1px solid ${t.border}`,
                  background: t.bg === "#151311" ? (navPath.category === 'Social Media' ? t.surface2 : t.bg) : '#ffffff',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  outline: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="text-left font-display leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700, color: t.text }}>Social Media</span>
                <img src="/Png/social-messaging-4.png" alt="Social Media" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
              </button>
              <button 
                onClick={() => setNavPath({ category: 'Ads & Paid Media', subcategory: null })} 
                className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Ads & Paid Media' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden shadow-sm`}
                style={{
                  border: `1px solid ${t.border}`,
                  borderBottom: navPath.category === 'Ads & Paid Media' ? `2px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` : `1px solid ${t.border}`,
                  background: t.bg === "#151311" ? (navPath.category === 'Ads & Paid Media' ? t.surface2 : t.bg) : '#ffffff',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  outline: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="text-left font-display leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700, color: t.text }}>Ads & Paid<br/>Media</span>
                <img src="/Png/Ads-and-paid-media.png" alt="Ads & Paid Media" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
              </button>
              <button 
                onClick={() => setNavPath({ category: 'Email', subcategory: null })} 
                className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Email' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden shadow-sm`}
                style={{
                  border: `1px solid ${t.border}`,
                  borderBottom: navPath.category === 'Email' ? `2px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` : `1px solid ${t.border}`,
                  background: t.bg === "#151311" ? (navPath.category === 'Email' ? t.surface2 : t.bg) : '#ffffff',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  outline: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="text-left font-display leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700, color: t.text }}>Email</span>
                <img src="/Png/email-4.png" alt="Email" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
              </button>
              <button 
                onClick={() => setNavPath({ category: 'Website & Content', subcategory: null })} 
                className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Website & Content' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden shadow-sm`}
                style={{
                  border: `1px solid ${t.border}`,
                  borderBottom: navPath.category === 'Website & Content' ? `2px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` : `1px solid ${t.border}`,
                  background: t.bg === "#151311" ? (navPath.category === 'Website & Content' ? t.surface2 : t.bg) : '#ffffff',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  outline: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="text-left font-display leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700, color: t.text }}>Website &<br/>Content</span>
                <img src="/Png/website-content-4.png" alt="Website & Content" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
              </button>
              <button 
                onClick={() => setNavPath({ category: 'Business & Sales', subcategory: null })} 
                className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Business & Sales' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden shadow-sm`}
                style={{
                  border: `1px solid ${t.border}`,
                  borderBottom: navPath.category === 'Business & Sales' ? `2px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` : `1px solid ${t.border}`,
                  background: t.bg === "#151311" ? (navPath.category === 'Business & Sales' ? t.surface2 : t.bg) : '#ffffff',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  outline: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="text-left font-display leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700, color: t.text }}>Business &<br/>Sales</span>
                <img src="/Png/business-sales-4.png" alt="Business & Sales" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
              </button>
              <button 
                onClick={() => setNavPath({ category: 'Creative & Multimedia', subcategory: null })} 
                className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Creative & Multimedia' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden shadow-sm`}
                style={{
                  border: `1px solid ${t.border}`,
                  borderBottom: navPath.category === 'Creative & Multimedia' ? `2px solid ${t.bg === "#151311" ? "#ffffff" : "#000000"}` : `1px solid ${t.border}`,
                  background: t.bg === "#151311" ? (navPath.category === 'Creative & Multimedia' ? t.surface2 : t.bg) : '#ffffff',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  outline: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="text-left font-display leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700, color: t.text }}>Creative &<br/>Multimedia</span>
                <img src="/Png/creative-multimedia-4.png" alt="Creative & Multimedia" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
              </button>
            </div>

            {/* Subcategory Pills bar */}
            {renderSubcategoryBar()}

            {/* Prompts list grid */}
            <div className="w-full mt-6">
              <h4 className="text-sm font-normal mb-4 font-display" style={{ color: t.text }}>
                {searchTerm ? 'Search Results' : (navPath.category === null ? 'Recent Prompts' : (navPath.subcategory && navPath.subcategory !== 'Popular' ? navPath.subcategory : 'Popular'))}
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {getFilteredPrompts().map((promptItem, idx) => (
                  <div key={idx} onClick={() => handlePromptSelect(promptItem)} className="prompt-card cursor-pointer group select-none flex flex-col h-full">
                    <div className="border p-6 flex flex-col items-center justify-center aspect-[4/3] relative z-10 transition-all select-none mb-3" style={{ background: t.bg === "#151311" ? t.surface2 : "#ffffff", borderColor: t.border }}>
                      <PromptMockup subcategory={promptItem.subcategory} title={promptItem.title} />
                    </div>
                    <span className="text-xs font-semibold font-sans transition-colors block text-center mt-auto" style={{ color: t.text2 }}>{promptItem.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : view === "history" ? (
          <>
            {/* Back button — above the card */}
            <button
              onClick={() => setView("chat")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                padding: '0 0 12px 0',
                fontSize: 12.5,
                fontWeight: 500,
                color: t.text3,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = t.text}
              onMouseLeave={(e) => e.currentTarget.style.color = t.text3}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          <div style={{ background: t.bg === "#151311" ? t.surface : "#ffffff", border: `1px solid ${t.border}`, borderRadius: R.md, overflow: "hidden", minHeight: 450, padding: '24px', fontFamily: FONT, display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Header / Actions strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: t.text }}>Chats</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Search chats */}
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={chatSearchTerm}
                  onChange={(e) => setChatSearchTerm(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: R.md,
                    border: `1.5px solid ${t.border}`,
                    background: t.bg === "#151311" ? t.surface : "#ffffff",
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                    width: '200px'
                  }}
                />

                {/* Filter dropdown */}
                <select
                  value={chatFilter}
                  onChange={(e) => setChatFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: R.md,
                    border: `1.5px solid ${t.border}`,
                    background: t.bg === "#151311" ? t.surface : "#ffffff",
                    color: t.text,
                    fontSize: 13,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Filter by All</option>
                </select>

                {/* New chat button */}
                <button
                  onClick={() => {
                    setConversationId(null);
                    setMessages([]);
                    setView("chat");
                  }}
                  style={{
                    background: t.bg === "#151311" ? "#ffffff" : "#000000",
                    color: t.bg === "#151311" ? "#000000" : "#ffffff",
                    border: 'none',
                    borderRadius: R.md,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  New chat
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', flex: 1 }} className="studio-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}`, color: t.text3, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>User</th>
                    <th style={{ padding: '12px 16px' }}>Chat Title</th>
                    <th style={{ padding: '12px 16px' }}>Project</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingChats ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: t.text3 }}>
                        Loading chats...
                      </td>
                    </tr>
                  ) : filteredChats.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: t.text3 }}>
                        No conversations found
                      </td>
                    </tr>
                  ) : (
                    filteredChats.map(chat => {
                      const userDisplay = chat.user_name || localStorage.getItem("userName") || "—";
                      const userInitial = userDisplay.substring(0, 1).toUpperCase();
                      const dateDisplay = timeSince(chat.createdAt || chat.created_at);
                      const projectName = chat.project_name || chat.projectName || "—";
                      
                      return (
                        <tr
                          key={chat.id}
                          onClick={() => {
                            if (editingChatId !== chat.id) {
                              loadConversation(chat.id);
                            }
                          }}
                          onMouseEnter={() => setHoveredChatId(chat.id)}
                          onMouseLeave={() => setHoveredChatId(null)}
                          style={{
                            borderBottom: `1px solid ${t.border}`,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          className="chat-history-row"
                        >
                          <style>{`
                            .chat-history-row:hover {
                              background: ${t.bg === "#151311" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)"} !important;
                            }
                            .edit-title-btn {
                              opacity: 0;
                              transition: opacity 0.2s;
                            }
                            .chat-history-row:hover .edit-title-btn {
                              opacity: 1;
                            }
                          `}</style>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: '#1e293b', color: '#ffffff',
                                display: 'grid', placeItems: 'center',
                                fontSize: 11, fontWeight: 700
                              }}>
                                {userInitial}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{userDisplay}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13.5, fontWeight: 700, color: t.text }}>
                            {editingChatId === chat.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editChatTitle}
                                  onChange={(e) => setEditChatTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveTitle(chat.id);
                                    } else if (e.key === 'Escape') {
                                      setEditingChatId(null);
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    padding: '4px 8px',
                                    border: `1.5px solid ${t.border}`,
                                    borderRadius: R.sm,
                                    background: t.bg === "#151311" ? t.surface2 : "#ffffff",
                                    color: t.text,
                                    fontSize: 13,
                                    outline: 'none',
                                    width: '200px',
                                    fontFamily: FONT
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveTitle(chat.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#10b981',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Save"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setEditingChatId(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: t.danger || '#ef4444',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Cancel"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{chat.title || "Untitled Chat"}</span>
                                <button
                                  className="edit-title-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingChatId(chat.id);
                                    setEditChatTitle(chat.title || "");
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: t.text3,
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Rename chat"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {projectName !== "—" ? (
                              <span style={{
                                fontSize: 10.5, fontWeight: 700,
                                background: t.bg === "#151311" ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.15)',
                                color: t.bg === "#151311" ? '#eab308' : '#ca8a04',
                                padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.03em'
                              }}>
                                {projectName}
                              </span>
                            ) : (
                              <span style={{ color: t.text3 }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: t.text3 }}>
                            {dateDisplay}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteChat(chat.id)}
                              style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', padding: 6 }}
                              title="Delete chat"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
        ) : (
          /* view === "chat" */
          !((messages || []).some(m => m.role !== 'status')) ? (
            /* ── EMPTY STATE: greeting + input bar vertically centred ── */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '110px 20px 60px',
              position: 'relative',
              flex: 1
            }}>
              {/* Back button and chats history header strip */}
              <div style={{ position: 'absolute', top: 10, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                <button
                  onClick={() => setView("library")}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: t.text3,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = t.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = t.text3}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Prompts Library
                </button>

                <button
                  onClick={() => { fetchRecentChats(); setView("history"); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: t.text3,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = t.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = t.text3}
                >
                  <span>Chats</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              {/* Greeting text */}
              <ChatWindow
                messages={messages}
                isProcessing={isGenerating}
                currentConversationId={conversationId}
                onShowPricing={() => showToast("5,000,000 token credits active. Full admin access enabled.")}
                onCopyMessage={(msg) => {
                  navigator.clipboard.writeText(msg.text);
                  showToast("Copied to clipboard");
                }}
                onRegenerate={regenerate}
                onNavigateToPrompts={() => setView("library")}
              />
              {/* Input bar — sits directly under the greeting */}
              <div style={{ maxWidth: '850px', width: '100%', marginTop: '20px', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '115%',
                  height: '350px',
                  pointerEvents: 'none',
                  zIndex: 0,
                  background: t.bg === "#151311"
                    ? 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(14, 165, 233, 0) 70%)'
                    : 'radial-gradient(circle, rgba(206, 235, 255, 0.75) 0%, rgba(206, 235, 255, 0) 70%)',
                  filter: 'blur(40px)',
                }} />
                <div style={{ position: 'relative', zIndex: 20 }}>
                  <InputBar
                    ref={inputBarRef}
                    onSendMessage={handleSendMessage}
                    onUpdateLastMessage={handleUpdateLastMessage}
                    onUpdateLastMessageId={handleUpdateLastMessageId}
                    currentConversationId={conversationId}
                    onConversationIdChange={setConversationId}
                    onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
                    isProcessing={isGenerating}
                    setIsProcessing={setIsGenerating}
                    messages={messages}
                    selectedLLM={selectedLLM}
                    onLLMChange={setSelectedLLM}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── ACTIVE STATE: scrollable messages + pinned input bar ── */
            <div style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              borderRadius: '0px',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <style>{`
                .hide-scrollbar-on-clean::-webkit-scrollbar {
                  width: 6px;
                }
                .hide-scrollbar-on-clean::-webkit-scrollbar-track {
                  background: transparent;
                }
                .hide-scrollbar-on-clean::-webkit-scrollbar-thumb {
                  background: ${t.bg === "#151311" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"};
                  border-radius: 3px;
                }
              `}</style>
              {/* Back button strip */}
              {/* Back button and chats history header strip */}
              <div style={{ padding: '10px 20px 0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                <button
                  onClick={() => setView("library")}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: t.text3,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = t.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = t.text3}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Prompts Library
                </button>

                <button
                  onClick={() => { fetchRecentChats(); setView("history"); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: t.text3,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = t.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = t.text3}
                >
                  <span>Chats</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              {/* Scrollable messages area */}
              <div className="hide-scrollbar-on-clean" style={{
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: '140px'
              }}>
                <ChatWindow
                  messages={messages}
                  isProcessing={isGenerating}
                  currentConversationId={conversationId}
                  onShowPricing={() => showToast("5,000,000 token credits active. Full admin access enabled.")}
                  onCopyMessage={(msg) => {
                    navigator.clipboard.writeText(msg.text);
                    showToast("Copied to clipboard");
                  }}
                  onRegenerate={regenerate}
                  onNavigateToPrompts={() => setView("library")}
                  onApprove={() => {
                    showToast("This chat is not connected to any workflow");
                  }}
                />
              </div>

              <div className="fixed-input-bar-container" style={{
                background: `linear-gradient(to top, ${t.bg} 55%, ${t.bg}00 100%)`,
                paddingBottom: '10px',
                paddingTop: '24px',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'none',
                zIndex: 20
              }}>
                <style>{`
                  .fixed-input-bar-container {
                    position: fixed;
                    bottom: 0px;
                    left: 0;
                    right: 0;
                  }
                  @media (min-width: 721px) {
                    .fixed-input-bar-container {
                      left: 248px;
                    }
                  }
                  @media (min-width: 721px) and (max-width: 1079px) {
                    .fixed-input-bar-container {
                      left: 64px;
                    }
                  }
                `}</style>
                <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto', pointerEvents: 'auto' }}>
                  <InputBar
                    ref={inputBarRef}
                    onSendMessage={handleSendMessage}
                    onUpdateLastMessage={handleUpdateLastMessage}
                    onUpdateLastMessageId={handleUpdateLastMessageId}
                    currentConversationId={conversationId}
                    onConversationIdChange={setConversationId}
                    onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
                    isProcessing={isGenerating}
                    setIsProcessing={setIsGenerating}
                    messages={messages}
                    selectedLLM={selectedLLM}
                    onLLMChange={setSelectedLLM}
                  />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Prompt Library Modal ──────────────────────────── */}
      <PromptsModal 
        isOpen={isPromptsModalOpen}
        onClose={() => setIsPromptsModalOpen(false)}
        onSelectPrompt={(description, title) => {
          inputBarRef.current?.setTemplate(description, title);
          setPrompt(description);
          setTemplate(title);
          setIsPromptsModalOpen(false);
        }}
      />
    </div>
  );
}
