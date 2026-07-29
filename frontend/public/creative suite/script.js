// Tailwind configuration
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: '#e63946',
        'brand-fg': '#ffffff',
        ink: '#16192b',
        surface: '#f7f8fa',
        'surface-alt': '#dddddd',
        border: '#e6e8ee',
        muted: '#6b7080',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};

// Page scripts
// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
document.getElementById('mobile-toggle').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('hidden');
});

// Suite cards
const suite = [
  { name: "Image Generator", desc: "Create stunning visuals from a short prompt in seconds.", tint: "bg-rose-50 text-rose-600", icon: "🖼" },
  { name: "Video Generator", desc: "Turn ideas into shareable videos — no editing skills required.", tint: "bg-violet-50 text-violet-600", icon: "🎬" },
  { name: "Copy Generator", desc: "Write headlines, ads and emails that actually sound like you.", tint: "bg-amber-50 text-amber-700", icon: "✍️" },
  { name: "Strategy", desc: "Plan campaigns and content with AI that thinks like a marketer.", tint: "bg-sky-50 text-sky-600", icon: "🧭" },
  { name: "Generative Engine Optimization", desc: "Make sure AI search engines find — and recommend — your brand.", tint: "bg-emerald-50 text-emerald-700", icon: "🔍" },
  { name: "Presentation Maker", desc: "Build beautiful decks from a single line of text.", tint: "bg-orange-50 text-orange-600", icon: "📊" },
  { name: "Canva Clone", desc: "A simple design studio for posters, posts and everything in between.", tint: "bg-pink-50 text-pink-600", icon: "🎨" },
  { name: "Website Builder", desc: "Launch a polished website in minutes — just describe what you want.", tint: "bg-indigo-50 text-indigo-600", icon: "🌐" },
  { name: "App Builder", desc: "Go from idea to a working app without writing a single line of code.", tint: "bg-teal-50 text-teal-600", icon: "📱" },
];

document.getElementById('suite-grid').innerHTML = suite.map(s => `
  <div class="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
    <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl ${s.tint} text-lg">${s.icon}</div>
    <h3 class="mt-5 text-lg font-semibold">${s.name}</h3>
    <p class="mt-2 text-sm text-muted">${s.desc}</p>
    <div class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand opacity-0 transition group-hover:opacity-100">Try it now →</div>
  </div>
`).join('');

// Tabs
const tabContent = [
  { title: "Make more, faster — without the busywork.", points: [
    "Drop a prompt, get a finished piece. Edit, tweak and ship the same day.",
    "Stay in flow with apps that talk to each other across the suite.",
    "Keep your brand looking sharp with reusable templates and assets.",
  ]},
  { title: "Launch campaigns in days, not months.", points: [
    "Go from brief to fully built campaign — copy, visuals and landing page included.",
    "Test variations instantly and double down on what works.",
    "Keep messaging on-brand across every channel automatically.",
  ]},
  { title: "One workspace your whole team will love.", points: [
    "Invite teammates, share brand kits and collaborate in real time.",
    "Roles and permissions keep work organized as you grow.",
    "Built-in approvals and version history so nothing gets lost.",
  ]},
];
function renderTab(i){
  document.getElementById('tab-title').textContent = tabContent[i].title;
  document.getElementById('tab-points').innerHTML = tabContent[i].points.map(p =>
    `<li class="flex gap-3 text-sm text-ink/80"><span class="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand"></span>${p}</li>`
  ).join('');
}
renderTab(0);
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.classList.add('bg-white','text-ink/70'); });
    btn.classList.add('active'); btn.classList.remove('bg-white','text-ink/70');
    renderTab(parseInt(btn.dataset.tab));
  });
});

// FAQ
const faqs = [
  { q: "What is Cog Culture?", a: "Cog Culture is an all-in-one AI suite that helps you create images, videos, copy, presentations, websites and apps — without juggling a dozen different tools." },
  { q: "Do I need any design or coding skills?", a: "Not at all. If you can describe what you want, Cog Culture can make it. Everything is built for beginners, with plenty of room for pros to go deeper." },
  { q: "Can I try it for free?", a: "Yes. Every plan starts with a free trial so you can explore the full suite before you commit." },
  { q: "Is my work and data private?", a: "Always. Your prompts, files, and brand assets stay yours. We never train public models on your private content." },
  { q: "Does it work for teams?", a: "Yes. Invite teammates, share brand kits and collaborate in real time on any project across the suite." },
  { q: "Can I cancel anytime?", a: "Of course. Plans are month-to-month and you can upgrade, downgrade or cancel whenever you like." },
];
document.getElementById('faq').innerHTML = faqs.map((f,i) => `
  <details ${i===0?'open':''}>
    <summary class="flex w-full items-center justify-between gap-4 py-5">
      <span class="text-base font-semibold">${f.q}</span>
      <span class="faq-plus text-xl text-muted">+</span>
    </summary>
    <p class="pb-5 text-sm leading-relaxed text-muted">${f.a}</p>
  </details>
`).join('');
