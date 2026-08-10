import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from "react-dom";
import { PROMPTS_DATA, getPromptIconInfo } from '../../utils/promptsData';
import PromptMockup from './PromptMockup';

export default function PromptsModal({
  isOpen,
  onClose,
  onSelectPrompt
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [navPath, setNavPath] = useState({ category: null, subcategory: null });
  const gridRef = useRef(null);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
  }, [navPath]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setNavPath({ category: null, subcategory: null });
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleCardClick = (prompt) => {
    
    onSelectPrompt(prompt.prompt || prompt.description, prompt.title);
  };

  const renderSubcategoryBar = () => {
    if (!navPath.category) return null;

    const catMapping = {
      'Social Media': 'Social & Messaging',
      'Ads & Paid Media': 'Ads & Paid Media',
      'Email': 'Email',
      'Website & Content': 'Website & Content',
      'Business & Sales': 'Business & Sales',
      'Creative & Multimedia': 'Creative & Multimedia',
    };
    const allPrompts = getAllPrompts();
    const subcatSet = new Set();
    allPrompts.forEach(p => {
      let cat = p.category;
      if (cat === 'Social & Messaging') cat = 'Social Media';
      if (cat === navPath.category && p.subcategory) {
        subcatSet.add(p.subcategory);
      }
    });

    const preferredOrder = {
      'Social Media': ['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'Twitter/X', 'YouTube', 'WhatsApp', 'Utility'],
      'Email': ['Campaign/Marketing', 'Frameworks', 'Lifecycle/Transactional'],
      'Website & Content': ['SEO & Content', 'Web Pages', 'Product Copy', 'UX & System Copy', 'Repurposing'],
      'Business & Sales': ['Outreach & Cold Email', 'LinkedIn (Sales)', 'Sales Process', 'Brand Identity', 'PR & Press'],
      'Creative & Multimedia': ['Video & Audio', 'Digital Creative Formats', 'Print & Offline', 'Utilities'],
    };
    const orderList = preferredOrder[navPath.category] || [];
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
      <div className="flex w-full mb-0 items-center justify-start gap-0 overflow-x-auto scrollbar-none select-none border-b border-neutral-200" style={{ gap: '0px' }}>
        <button
          onClick={() => setNavPath({ ...navPath, subcategory: 'Popular' })}
          className={`px-4 py-2 text-xs focus:outline-none shrink-0 -mb-px ${navPath.subcategory === 'Popular' || !navPath.subcategory ? 'text-black font-bold' : 'text-gray-500 hover:text-black font-semibold'} bg-transparent`}
          style={{ 
            border: 'none', 
            borderBottom: navPath.subcategory === 'Popular' || !navPath.subcategory ? '3px solid #000000' : '3px solid transparent',
            paddingBottom: '8px',
            borderRadius: '0px',
            outline: 'none',
            boxShadow: 'none',
            cursor: 'pointer'
          }}
        >
          Popular
        </button>
        {subcats.map(sub => (
          <button
            key={sub}
            onClick={() => setNavPath({ ...navPath, subcategory: sub })}
            className={`px-4 py-2 text-xs flex items-center gap-1.5 focus:outline-none shrink-0 -mb-px ${navPath.subcategory === sub ? 'text-black font-bold' : 'text-gray-500 hover:text-black font-semibold'} bg-transparent`}
            style={{ 
              border: 'none', 
              borderBottom: navPath.subcategory === sub ? '3px solid #000000' : '3px solid transparent',
              paddingBottom: '8px',
              borderRadius: '0px',
              outline: 'none',
              boxShadow: 'none',
              cursor: 'pointer'
            }}
          >
            {subIcons[sub] || null}
            <span>{sub}</span>
          </button>
        ))}
      </div>
    );
  };

  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
  }

  return ReactDOM.createPortal(
    <div className="prompt-modal-overlay" onClick={onClose}>
      <style>{`
        .prompt-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .prompt-modal-card {
          background: #ffffff;
          width: 100%;
          max-width: 1100px;
          height: 90vh;
          border-radius: 0px !important;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); }
          to { transform: translateY(0); }
        }
        .modal-hub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #FFFFFF;
          border-bottom: 0.5px solid rgba(0,0,0,0.08);
          flex-shrink: 0;
        }
        .modal-hub-title h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: #1A1A1A;
          font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
        }
        .modal-hub-title p {
          font-size: 12px;
          color: #65645F;
          margin: 2px 0 0;
        }
        .modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #F5F5F5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .modal-close-btn:hover { background: #EBEAE4; }

        .modal-hub-scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: #ffffff;
        }
        .prompt-category-btn {
          transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out, transform 0.2s ease-in-out !important;
          cursor: pointer !important;
        }
        .prompt-category-btn:hover {
          border-color: #cbd5e1 !important;
          background-color: #ffffff !important;
          transform: translateY(-2px);
        }
        .prompt-category-btn.is-active,
        .prompt-category-btn.is-active:hover {
          border-bottom: 2px solid #000000 !important;
          background-color: #ffffff !important;
        }

        .prompt-card { transition: all 0.2s; }
        .prompt-card:hover { transform: translateY(-2px); }
        .prompt-card > div {
          border: 1px solid #e5e7eb !important;
          border-radius: 0px !important;
        }
        .prompt-card:hover > div {
          border-color: #9ca3af !important;
        }
      `}</style>

      <div className="prompt-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hub-header">
          <div className="modal-hub-title">
            <h2>Prompt Library</h2>
            <p>Select a template to jumpstart your content</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ borderRadius: '50%', color: '#111827' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-hub-scrollable-content">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mb-6">
            <div className="relative w-full max-w-md">
              <span style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input 
                type="text" 
                onChange={(e) => setSearchTerm(e.target.value)} 
                value={searchTerm} 
                placeholder="Search templates..." 
                className="w-full py-2 border text-sm bg-white focus:outline-none" 
                style={{ 
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  borderRadius: '0px',
                  border: '1.5px solid #e5e7eb',
                  boxShadow: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#000000';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                }}
              />
            </div>
          </div>

          {/* 6 Category cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 w-full px-0 py-2 mb-6">
            <button 
              onClick={() => setNavPath({ category: 'Social Media', subcategory: 'Popular' })} 
              className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Social Media' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden bg-white hover:bg-neutral-50 shadow-sm`}
              style={{
                border: '1px solid #e5e7eb',
                borderBottom: navPath.category === 'Social Media' ? '2px solid #000000' : '1px solid #e5e7eb',
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
              <span className="text-left font-display text-gray-900 leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700 }}>Social Media</span>
              <img src="/Png/social-messaging-4.png" alt="Social Media" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
            </button>
            <button 
              onClick={() => setNavPath({ category: 'Ads & Paid Media', subcategory: null })} 
              className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Ads & Paid Media' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden bg-white hover:bg-neutral-50 shadow-sm`}
              style={{
                border: '1px solid #e5e7eb',
                borderBottom: navPath.category === 'Ads & Paid Media' ? '2px solid #000000' : '1px solid #e5e7eb',
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
              <span className="text-left font-display text-gray-900 leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700 }}>Ads & Paid<br/>Media</span>
              <img src="/Png/Ads-and-paid-media.png" alt="Ads & Paid Media" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
            </button>
            <button 
              onClick={() => setNavPath({ category: 'Email', subcategory: null })} 
              className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Email' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden bg-white hover:bg-neutral-50 shadow-sm`}
              style={{
                border: '1px solid #e5e7eb',
                borderBottom: navPath.category === 'Email' ? '2px solid #000000' : '1px solid #e5e7eb',
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
              <span className="text-left font-display text-gray-900 leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700 }}>Email</span>
              <img src="/Png/email-4.png" alt="Email" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
            </button>
            <button 
              onClick={() => setNavPath({ category: 'Website & Content', subcategory: null })} 
              className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Website & Content' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden bg-white hover:bg-neutral-50 shadow-sm`}
              style={{
                border: '1px solid #e5e7eb',
                borderBottom: navPath.category === 'Website & Content' ? '2px solid #000000' : '1px solid #e5e7eb',
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
              <span className="text-left font-display text-gray-900 leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700 }}>Website &<br/>Content</span>
              <img src="/Png/website-content-4.png" alt="Website & Content" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
            </button>
            <button 
              onClick={() => setNavPath({ category: 'Business & Sales', subcategory: null })} 
              className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Business & Sales' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden bg-white hover:bg-neutral-50 shadow-sm`}
              style={{
                border: '1px solid #e5e7eb',
                borderBottom: navPath.category === 'Business & Sales' ? '2px solid #000000' : '1px solid #e5e7eb',
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
              <span className="text-left font-display text-gray-900 leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700 }}>Business &<br/>Sales</span>
              <img src="/Png/business-sales-4.png" alt="Business & Sales" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
            </button>
            <button 
              onClick={() => setNavPath({ category: 'Creative & Multimedia', subcategory: null })} 
              className={`w-full aspect-[172/123] prompt-category-btn ${navPath.category === 'Creative & Multimedia' ? 'is-active' : ''} focus:outline-none transition-all relative p-3 overflow-hidden bg-white hover:bg-neutral-50 shadow-sm`}
              style={{
                border: '1px solid #e5e7eb',
                borderBottom: navPath.category === 'Creative & Multimedia' ? '2px solid #000000' : '1px solid #e5e7eb',
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
              <span className="text-left font-display text-gray-900 leading-tight select-none block z-10 relative" style={{ fontSize: '13.5px', fontWeight: 700 }}>Creative &<br/>Multimedia</span>
              <img src="/Png/creative-multimedia-4.png" alt="Creative & Multimedia" loading="eager" decoding="sync" className="absolute bottom-0 right-0 w-[55%] max-w-[95px] h-auto object-contain" />
            </button>
          </div>

          {/* Subcategory Pills bar */}
          {renderSubcategoryBar()}

          {/* Prompts list grid */}
          <div className="w-full mt-6">
            <h4 className="text-sm font-normal text-gray-900 mb-4 font-display">
              {searchTerm ? 'Search Results' : (navPath.category === null ? 'Recent Prompts' : (navPath.subcategory && navPath.subcategory !== 'Popular' ? navPath.subcategory : 'Popular'))}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {getFilteredPrompts().map((prompt, idx) => (
                <div key={idx} onClick={() => handleCardClick(prompt)} className="prompt-card cursor-pointer group select-none flex flex-col h-full">
                  <div className="bg-white border p-6 flex flex-col items-center justify-center aspect-[4/3] relative z-10 transition-all select-none mb-3">
                    <PromptMockup subcategory={prompt.subcategory} title={prompt.title} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-black font-sans transition-colors block text-center mt-auto">{prompt.title}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>,
    modalRoot
  );
}
