import React from 'react';

export function getMockupHtml(subcategory, title = '') {
  const name = (title || '').toLowerCase();
  
  if (name.includes('facebook ad') || name.includes('facebook video')) {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left">
          <span class="w-2 h-2 rounded-full bg-blue-600 flex items-center justify-center text-[5px] text-white font-black" style="border-radius: 9999px !important; line-height: 1;">f</span>
          <div class="h-1 w-6 bg-neutral-200"></div>
        </div>
        <span class="text-[3.5px] font-bold text-gray-400 bg-neutral-50 px-1 py-0.2 self-start" style="border: 1px solid rgba(110,110,110,0.25);">Sponsored</span>
        <div class="h-1.5 w-5 bg-neutral-200 self-start"></div>
        <div class="flex-grow bg-amber-500 flex flex-col justify-end p-1 relative" style="border: 1px solid rgba(110,110,110,0.25);">
          <div class="absolute bottom-1 right-1 w-4 h-4 bg-amber-600 rotate-12"></div>
        </div>
      </div>
    `;
  } else if (name.includes('instagram ad')) {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col gap-0.5" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left mb-0.5">
          <span class="w-2 h-2 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-[5px] text-white" style="border-radius: 9999px !important;"></span>
          <div class="flex flex-col">
            <div class="h-1 w-6 bg-neutral-200"></div>
            <div class="text-[3px] text-gray-400 font-bold" style="line-height:1;">Sponsored</div>
          </div>
        </div>
        <div class="flex-grow bg-rose-50 flex flex-col justify-end p-0.5 relative overflow-hidden" style="border: 1px solid rgba(110,110,110,0.25);">
          <div class="absolute inset-0 bg-gradient-to-tr from-pink-500 to-rose-600 opacity-80"></div>
        </div>
      </div>
    `;
  } else if (name.includes('google ad') || name.includes('bing ad') || name.includes('google ads')) {
    return `
      <div class="w-24 h-16 bg-white shadow-sm p-1.5 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="flex items-center gap-1">
          <span class="text-[5px] text-neutral-400 font-bold">Ad</span>
          <span class="text-[5px] text-blue-700 font-bold">${name.includes('google') ? 'google' : 'bing'}.com</span>
        </div>
        <div class="h-2 w-full bg-blue-800 rounded-sm" style="border-radius: 2px !important;"></div>
        <div class="h-1 w-4/5 bg-neutral-300"></div>
      </div>
    `;
  } else if (name.includes('linkedin sponsored')) {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-700 flex items-center justify-center text-[4px] text-white font-bold" style="border-radius: 9999px !important;">in</span>
          <div class="h-1 w-6 bg-neutral-200"></div>
        </div>
        <span class="text-[3px] text-gray-400 font-bold">Promoted</span>
        <div class="h-1 w-full bg-neutral-200"></div>
        <div class="flex-grow bg-slate-100 flex flex-col justify-end p-1 relative">
          <div class="h-1 w-full bg-blue-700/60"></div>
        </div>
      </div>
    `;
  } else if (name.includes('promoted tweet')) {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1.5 flex flex-col gap-1.5" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left">
          <span class="w-3 h-3 rounded-full bg-black flex items-center justify-center text-[6px] text-white font-bold" style="border-radius: 9999px !important;">𝕏</span>
          <div class="h-1 w-5 bg-neutral-200"></div>
        </div>
        <span class="text-[3px] text-gray-400 font-bold">Promoted</span>
        <div class="h-1 w-full bg-neutral-200"></div>
        <div class="h-1 w-2/3 bg-neutral-200"></div>
      </div>
    `;
  } else if (name.includes('tiktok spark')) {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col justify-between" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex-grow bg-red-500 flex flex-col justify-center items-center relative overflow-hidden">
          <div class="absolute top-1 left-1 w-3 h-3 bg-black rounded-full flex items-center justify-center text-[4px] text-white" style="border-radius: 9999px !important;">t</div>
          <div class="absolute top-1.5 right-1 text-[3px] text-white font-bold">Sponsored</div>
          <div class="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-red-500 shadow-sm" style="border-radius: 9999px !important;">
            <svg class="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    `;
  } else if (name.includes('youtube pre-roll') || name.includes('youtube bumper')) {
    return `
      <div class="w-24 h-16 bg-white shadow-sm p-1 flex flex-col gap-0.5" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="flex-grow bg-red-50 flex flex-col p-1 justify-between relative overflow-hidden">
          <div class="absolute top-1 left-1 w-3.5 h-2 bg-red-600 rounded flex items-center justify-center text-[3px] text-white" style="border-radius: 2px !important;">▶</div>
          <div class="absolute bottom-1 right-1 w-8 h-8 bg-red-400 rounded-full" style="border-radius: 9999px !important;"></div>
          <span class="absolute bottom-1 left-1 text-[4px] text-white bg-black/60 px-0.5 py-0.2">Ad</span>
        </div>
      </div>
    `;
  } else if (name.includes('pinterest promoted')) {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex-grow bg-neutral-100 flex flex-col justify-end p-1 relative">
          <span class="text-[3px] text-gray-500 font-bold bg-white/80 px-1 py-0.2 self-start rounded">Promoted Pin</span>
        </div>
      </div>
    `;
  }

  if (subcategory === 'Instagram') {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col gap-0.5" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left mb-0.5">
          <span class="w-2 h-2 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-[5px] text-white" style="border-radius: 9999px !important;"></span>
          <div class="h-1 w-6 bg-neutral-200"></div>
        </div>
        <div class="flex-grow bg-rose-50 flex flex-col justify-end p-0.5 relative overflow-hidden" style="border: 1px solid rgba(90,90,90,0.22);">
          <div class="absolute inset-0 bg-gradient-to-tr from-pink-500 to-rose-600 opacity-80"></div>
          <div class="h-2 w-full bg-neutral-900/40 relative z-10"></div>
        </div>
        <div class="flex gap-0.5 py-0.5">
          <div class="w-1.5 h-1.5 bg-neutral-300" style="border-radius: 9999px !important;"></div>
          <div class="w-1.5 h-1.5 bg-neutral-300" style="border-radius: 9999px !important;"></div>
        </div>
      </div>
    `;
  } else if (subcategory === 'LinkedIn') {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-700 flex items-center justify-center text-[4px] text-white font-bold" style="border-radius: 9999px !important;">in</span>
          <div class="h-1 w-6 bg-neutral-200"></div>
        </div>
        <div class="h-1 w-full bg-neutral-200"></div>
        <div class="h-1 w-4/5 bg-neutral-200"></div>
        <div class="flex-grow bg-slate-100 flex flex-col justify-end p-1 relative">
          <div class="h-1 w-full bg-blue-700/60"></div>
        </div>
      </div>
    `;
  } else if (subcategory === 'Facebook') {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left">
          <span class="w-2 h-2 rounded-full bg-blue-600 flex items-center justify-center text-[5px] text-white font-black" style="border-radius: 9999px !important; line-height: 1;">f</span>
          <div class="h-1 w-6 bg-neutral-200"></div>
        </div>
        <div class="h-2 w-5 bg-neutral-200 self-start"></div>
        <div class="flex-grow bg-amber-500 flex flex-col justify-end p-1 relative" style="border: 1px solid rgba(90,90,90,0.22);">
          <div class="absolute bottom-1 right-1 w-4 h-4 bg-amber-600 rotate-12"></div>
        </div>
        <div class="h-1 w-full bg-neutral-100"></div>
      </div>
    `;
  } else if (subcategory === 'TikTok') {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col justify-between" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex-grow bg-red-500 flex flex-col justify-center items-center relative overflow-hidden">
          <div class="absolute top-1 left-1 w-3 h-3 bg-black rounded-full flex items-center justify-center text-[4px] text-white" style="border-radius: 9999px !important;">t</div>
          <div class="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-red-500 shadow-sm" style="border-radius: 9999px !important;">
            <svg class="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    `;
  } else if (subcategory === 'Twitter/X') {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1.5 flex flex-col gap-1.5" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex items-center gap-1 scale-90 origin-left">
          <span class="w-3 h-3 rounded-full bg-black flex items-center justify-center text-[6px] text-white font-bold" style="border-radius: 9999px !important;">𝕏</span>
          <div class="h-1 w-5 bg-neutral-200"></div>
        </div>
        <div class="h-1 w-full bg-neutral-200"></div>
        <div class="h-1 w-full bg-neutral-200"></div>
        <div class="h-1 w-2/3 bg-neutral-200"></div>
      </div>
    `;
  } else if (subcategory === 'YouTube') {
    return `
      <div class="w-24 h-16 bg-white shadow-sm p-1 flex flex-col gap-0.5" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="flex-grow bg-red-50 flex flex-col p-1 justify-between relative overflow-hidden">
          <div class="absolute top-1 left-1 w-3.5 h-2 bg-red-600 rounded flex items-center justify-center text-[3px] text-white" style="border-radius: 2px !important;">▶</div>
          <div class="absolute bottom-1 right-1 w-8 h-8 bg-red-400 rounded-full" style="border-radius: 9999px !important;"></div>
        </div>
        <div class="h-2 w-full flex items-center justify-between">
          <div class="h-1 w-8 bg-neutral-300"></div>
          <div class="h-1 w-4 bg-neutral-300"></div>
        </div>
      </div>
    `;
  } else if (subcategory === 'Frameworks') {
    return `
      <div class="w-18 h-18 bg-white shadow-sm p-1.5 flex flex-col gap-1 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <span class="text-[10px] font-black text-purple-700 tracking-wider">A I D A</span>
        <div class="h-1 w-12 bg-neutral-200"></div>
        <div class="h-1 w-10 bg-neutral-200"></div>
      </div>
    `;
  } else if (subcategory === 'Lifecycle/Transactional') {
    return `
      <div class="w-18 h-18 bg-white shadow-sm p-1.5 flex flex-col gap-1 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="flex items-center gap-1">
          <span class="text-[9px] font-bold text-sky-600">🔄</span>
          <span class="text-[8px] font-bold text-gray-500">Lifecycle</span>
        </div>
        <div class="h-1.5 w-12 bg-sky-100 rounded-sm"></div>
        <div class="h-1 w-10 bg-neutral-200"></div>
      </div>
    `;
  } else if (subcategory === 'Campaign/Marketing') {
    return `
      <div class="w-18 h-18 bg-white shadow-sm p-1.5 flex flex-col gap-1 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="w-12 h-6 bg-pink-100 rounded flex items-center justify-center text-[7px] text-pink-700 font-bold" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 2px !important;">
          NEWS
        </div>
        <div class="h-1 w-12 bg-neutral-200"></div>
        <div class="h-1 w-8 bg-neutral-200"></div>
      </div>
    `;
  } else if (subcategory === 'WhatsApp') {
    return `
      <div class="w-16 h-28 bg-white shadow-sm p-1 flex flex-col justify-between" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 6px !important;">
        <div class="flex-grow bg-emerald-500 flex flex-col justify-between p-1 relative overflow-hidden">
          <div class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center text-[4px] text-emerald-600 font-bold" style="border-radius: 9999px !important;">w</span>
            <div class="h-1 w-4 bg-white/40"></div>
          </div>
          <div class="h-10 w-full bg-pink-100 rounded" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 3px !important;"></div>
        </div>
      </div>
    `;
  } else if (subcategory === 'SEO & Content') {
    return `
      <div class="w-20 h-16 bg-white shadow-sm p-1 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="h-2 w-full bg-neutral-100 flex items-center px-1 justify-between">
          <div class="w-1.5 h-1.5 rounded-full bg-neutral-300" style="border-radius: 9999px !important;"></div>
          <div class="w-8 h-1 bg-neutral-200"></div>
        </div>
        <div class="h-1 w-full bg-neutral-200"></div>
        <div class="h-1 w-3/4 bg-neutral-200"></div>
        <div class="h-1 w-1/2 bg-neutral-200"></div>
      </div>
    `;
  } else if (subcategory === 'Web Pages') {
    return `
      <div class="w-20 h-16 bg-white shadow-sm p-1 flex flex-col gap-1" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="h-3 w-full bg-neutral-100 flex items-center justify-between p-0.5" style="border-radius: 2px !important;">
          <div class="w-6 h-1.5 bg-neutral-300"></div>
          <div class="w-3 h-1.5 bg-indigo-500"></div>
        </div>
        <div class="flex-grow flex gap-1">
          <div class="w-1/2 bg-neutral-50 rounded" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 2px !important;"></div>
          <div class="w-1/2 flex flex-col gap-0.5">
            <div class="h-1 w-full bg-neutral-200"></div>
            <div class="h-1 w-full bg-neutral-200"></div>
          </div>
        </div>
      </div>
    `;
  } else if (subcategory === 'Product Copy') {
    return `
      <div class="w-18 h-18 bg-white shadow-sm p-1.5 flex flex-col gap-1 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <span class="text-[14px]">📦</span>
        <div class="h-1 w-8 bg-neutral-200"></div>
      </div>
    `;
  } else if (subcategory === 'UX & System Copy') {
    return `
      <div class="w-18 h-18 bg-white shadow-sm p-1.5 flex flex-col gap-1 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <div class="w-8 h-4 rounded bg-emerald-50 flex items-center justify-center text-[6px] text-emerald-700 font-bold" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 2px !important;">
          Success
        </div>
        <div class="h-1 w-10 bg-neutral-200"></div>
      </div>
    `;
  } else if (subcategory === 'Repurposing') {
    return `
      <div class="w-18 h-18 bg-white shadow-sm p-1.5 flex flex-col gap-1 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <span class="text-[12px] font-bold text-neutral-500">🔄</span>
        <span class="text-[6px] font-extrabold text-neutral-400">Repurpose</span>
      </div>
    `;
  } else if (subcategory === 'Utility') {
    return `
      <div class="w-20 h-16 bg-white shadow-sm p-2 flex flex-col gap-1 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <span class="text-xs font-bold text-indigo-600">🛠 UTILITY</span>
      </div>
    `;
  } else {
    return `
      <div class="w-20 h-16 bg-white shadow-sm p-2 flex flex-col gap-1.5 justify-center items-center" style="border: 1px solid rgba(90,90,90,0.35); border-radius: 4px !important;">
        <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
    `;
  }
}

const PromptMockup = ({ subcategory, title }) => {
  return (
    <div dangerouslySetInnerHTML={{ __html: getMockupHtml(subcategory, title) }} />
  );
};

export default PromptMockup;
