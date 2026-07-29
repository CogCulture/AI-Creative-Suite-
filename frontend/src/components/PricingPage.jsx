import { useState, useEffect, useRef } from "react";

export default function PricingPage({ onLogin, onNavigate, autoTriggerLogin }) {
  // --- Typewriter Loader State ---
  const [showLoader, setShowLoader] = useState(false);
  const [loaderText, setLoaderText] = useState("");
  const [loaderPhraseIdx, setLoaderPhraseIdx] = useState(0);
  const [loaderCharIdx, setLoaderCharIdx] = useState(0);
  const [loaderIsDeleting, setLoaderIsDeleting] = useState(false);

  const loaderPhrases = [
    '"Starting first draft..."',
    '"Setting up workspace..."'
  ];

  // --- Billing FAQs Open State ---
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // --- Auto-trigger login transition if query parameter is present ---
  useEffect(() => {
    if (autoTriggerLogin) {
      onNavigate("login");
    }
  }, [autoTriggerLogin]);

  // --- Typewriter Loader Execution ---
  useEffect(() => {
    if (!showLoader) return;

    const currentPhrase = loaderPhrases[loaderPhraseIdx];
    let delay = loaderIsDeleting ? 25 : 55;

    const runLoader = () => {
      if (loaderIsDeleting) {
        setLoaderText(currentPhrase.substring(0, loaderCharIdx - 1));
        setLoaderCharIdx((prev) => prev - 1);
      } else {
        setLoaderText(currentPhrase.substring(0, loaderCharIdx + 1));
        setLoaderCharIdx((prev) => prev + 1);
      }

      if (!loaderIsDeleting && loaderCharIdx === currentPhrase.length) {
        delay = 800;
        setLoaderIsDeleting(true);
      } else if (loaderIsDeleting && loaderCharIdx === 0) {
        delay = 200;
        setLoaderIsDeleting(false);
        setLoaderPhraseIdx((prev) => prev + 1);
      }
    };

    if (!loaderIsDeleting && loaderCharIdx === currentPhrase.length) {
      delay = 800;
    } else if (loaderIsDeleting && loaderCharIdx === 0) {
      delay = 200;
    }

    if (loaderPhraseIdx === loaderPhrases.length) {
      const completionTimer = setTimeout(() => {
        onLogin();
      }, 400);
      return () => clearTimeout(completionTimer);
    }

    const timer = setTimeout(runLoader, delay);
    return () => clearTimeout(timer);
  }, [showLoader, loaderPhraseIdx, loaderCharIdx, loaderIsDeleting]);

  const triggerLoginTransition = (e) => {
    if (e) e.preventDefault();
    onNavigate("login");
  };

  const faqs = [
    { q: "Can I upgrade or downgrade anytime?", a: "Yes. You can cancel, downgrade, or upgrade your plan directly inside your account billing settings. Changes are pro-rated immediately." },
    { q: "What happens at the end of the free trial?", a: "At the end of your 14-day trial, you will be shifted to a view-only tier. You won't be charged unless you explicitly opt to upgrade to the Pro plan." },
    { q: "Do you offer discounts for annual plans?", a: "Yes. Annual billing plans offer a 20% discount compared to monthly billing cycles. Please toggle annual billing inside checkout." },
    { q: "What is a closed-loop security model?", a: "For Enterprise clients, we isolate all models, databases, and generation checkpoints. Your input prompts, logos, and output materials are never uploaded to the public internet or used to retrain our central weights." }
  ];

  return (
    <div className="landing-page-root bg-white text-ink font-sans overflow-x-hidden min-h-screen">

      {/* HERO */}
      <section className="relative bg-white py-16 text-center">
        <div className="mx-auto max-w-3xl px-[70px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">SIMPLE PRICING</p>
          <h1 className="mt-3 text-3xl font-medium leading-[1.05] tracking-tight md:text-5xl font-display text-ink">
            Choose the plan that's<br /><span className="text-brand">right for your workflow.</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-sm leading-relaxed text-muted font-sans">
            Start creating immediately. Lock in custom branding, compliance checks, and priority support as you expand.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="bg-white py-16 pt-0">
        <div className="mx-auto max-w-7xl px-[70px]">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
            
            {/* Starter Plan */}
            <div className="bg-white border border-border p-8 rounded-none flex flex-col justify-between hover:shadow-md transition">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-4">STARTER</p>
                <span className="text-4xl font-bold font-display text-ink">$0</span>
                <span className="text-xs text-muted font-sans ml-1">Free 14-day trial</span>
                <p className="text-sm text-muted font-sans mt-4">
                  Explore the core generative apps and test high-quality content output.
                </p>
                <hr className="border-border my-6" />
                <ul className="space-y-3 text-sm text-ink/80">
                  <li className="flex items-center gap-2">✓ Access to standard Suite tools</li>
                  <li className="flex items-center gap-2">✓ Standard generation credits</li>
                  <li className="flex items-center gap-2">✓ Standard resolution downloads</li>
                  <li className="flex items-center gap-2">✓ Personal project license</li>
                </ul>
              </div>
              <div className="mt-8">
                <button
                  onClick={triggerLoginTransition}
                  className="block w-full border-[0.5px] border-black bg-white text-ink text-center py-2.5 font-semibold text-sm transition rounded-none hover:scale-[1.02] active:scale-[0.98] hover:bg-[#dddddd]"
                >
                  Start Free Trial
                </button>
              </div>
            </div>

            {/* Pro Plan (Most Popular) */}
            <div className="bg-white border border-black p-8 rounded-none flex flex-col justify-between hover:shadow-md transition relative">
              <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
                Popular
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand mb-4">PRO CREATOR</p>
                <span className="text-4xl font-bold font-display text-ink">$29</span>
                <span className="text-xs text-muted font-sans ml-1">/ seat / month</span>
                <p className="text-sm text-muted font-sans mt-4">
                  Unlimited assets, faster creation times, and commercial production usage permissions.
                </p>
                <hr className="border-border my-6" />
                <ul className="space-y-3 text-sm text-ink/80">
                  <li className="flex items-center gap-2">✓ <strong>Unlimited</strong> high-res creations</li>
                  <li className="flex items-center gap-2">✓ <strong>3x Faster</strong> generation speeds</li>
                  <li className="flex items-center gap-2">✓ Custom brand kits (logos, hex colors)</li>
                  <li className="flex items-center gap-2">✓ Commercial license for clients</li>
                  <li className="flex items-center gap-2">✓ Standard API endpoints</li>
                </ul>
              </div>
              <div className="mt-8">
                <button
                  onClick={triggerLoginTransition}
                  className="block w-full bg-brand text-white text-center py-2.5 rounded-none font-semibold text-sm hover:brightness-110 transition shadow-sm"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border border-border p-8 rounded-none flex flex-col justify-between hover:shadow-md transition">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand mb-4">ENTERPRISE</p>
                <span className="text-4xl font-bold font-display text-ink">Custom</span>
                <span className="text-xs text-muted font-sans ml-1">Volume scale billing</span>
                <p className="text-sm text-muted font-sans mt-4">
                  Closed-loop security workspace with fine-tuned private models and compliance checks.
                </p>
                <hr className="border-border my-6" />
                <ul className="space-y-3 text-sm text-ink/80">
                  <li className="flex items-center gap-2">✓ <strong>Closed-Loop IP protection</strong></li>
                  <li className="flex items-center gap-2">✓ Single Sign-On (SSO / SAML)</li>
                  <li className="flex items-center gap-2">✓ Fine-tuned custom brand models</li>
                  <li className="flex items-center gap-2">✓ 24/7 dedicated support architect</li>
                  <li className="flex items-center gap-2">✓ Strict SLA response guarantees</li>
                </ul>
              </div>
              <div className="mt-8">
                <button
                  onClick={triggerLoginTransition}
                  className="block w-full border-[0.5px] border-black bg-white text-ink text-center py-2.5 font-semibold text-sm transition rounded-none hover:scale-[1.02] active:scale-[0.98] hover:bg-[#dddddd]"
                >
                  Contact Sales
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURE TABLE */}
      <section className="bg-[#dddddd] py-16">
        <div className="mx-auto max-w-7xl px-[70px]">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">FEATURE COMPARISON</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">Compare our plans</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white rounded-none shadow-sm overflow-hidden">
              <thead>
                <tr class="border-b border-border bg-slate-50 text-xs font-semibold uppercase tracking-wider text-ink/70">
                  <th className="p-5 font-sans">Feature</th>
                  <th className="p-5 font-sans">Starter</th>
                  <th className="p-5 font-sans">Pro</th>
                  <th className="p-5 font-sans">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border/60">
                <tr>
                  <td className="p-5 font-medium text-ink">Core Creation Suite</td>
                  <td className="p-5 text-muted">Standard</td>
                  <td className="p-5 text-brand font-semibold">Standard + Pro Perks</td>
                  <td className="p-5 text-brand font-semibold">Fine-tuned Brand Models</td>
                </tr>
                <tr>
                  <td className="p-5 font-medium text-ink">Generation Speed</td>
                  <td className="p-5 text-muted">Standard Queue</td>
                  <td className="p-5 text-ink">Priority (3x faster)</td>
                  <td className="p-5 text-ink">Instant (Dedicated cluster)</td>
                </tr>
                <tr>
                  <td className="p-5 font-medium text-ink">Workspace Seats</td>
                  <td className="p-5 text-muted">1 Seat</td>
                  <td className="p-5 text-ink">Up to 25 Seats</td>
                  <td className="p-5 text-ink">Unlimited Seats</td>
                </tr>
                <tr>
                  <td className="p-5 font-medium text-ink">Custom Brand Kits</td>
                  <td className="p-5 text-muted">✗ Not Included</td>
                  <td className="p-5 text-brand font-semibold">Up to 3 Kits</td>
                  <td className="p-5 text-brand font-semibold">Unlimited Kits</td>
                </tr>
                <tr>
                  <td className="p-5 font-medium text-ink">SLA Guarantee</td>
                  <td className="p-5 text-muted">✗ Not Included</td>
                  <td className="p-5 text-muted">✗ Not Included</td>
                  <td className="p-5 text-ink">✓ 99.9% Uptime SLA</td>
                </tr>
                <tr>
                  <td className="p-5 font-medium text-ink">IP Protection</td>
                  <td className="p-5 text-muted">Standard Privacy</td>
                  <td className="p-5 text-muted">Standard Privacy</td>
                  <td className="p-5 text-brand font-semibold">Closed-loop (No training on IP)</td>
                </tr>
                <tr>
                  <td className="p-5 font-medium text-ink">Single Sign-On (SSO)</td>
                  <td className="p-5 text-muted">✗ Not Included</td>
                  <td className="p-5 text-muted">✗ Not Included</td>
                  <td className="p-5 text-brand font-semibold">✓ Okta, SAML, Azure AD</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-[70px]">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">BILLING FAQ</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">Pricing Questions?</h2>
          </div>
          
          <div id="faq" className="space-y-1">
            {faqs.map((f, i) => (
              <details key={i} open={openFaqIdx === i} onClick={(e) => { e.preventDefault(); setOpenFaqIdx(i); }}>
                <summary className="flex w-full items-center justify-between gap-4 py-5 border-t border-border cursor-pointer list-none">
                  <span className="text-lg font-semibold font-display text-ink">{f.q}</span>
                  <span className="faq-plus text-xl text-muted font-sans flex-shrink-0">{openFaqIdx === i ? "×" : "+"}</span>
                </summary>
                {openFaqIdx === i && (
                  <p className="pb-5 text-sm leading-relaxed text-muted font-sans">{f.a}</p>
                )}
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#dddddd] pt-16">
        <div className="mx-auto max-w-7xl px-[70px] pb-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 items-start w-full">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-black font-sans mb-6">AI Intelligence Suite</h4>
              <ul className="space-y-2 text-sm text-black">
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate("home"); }} className="hover:underline">Create</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate("home"); }} className="hover:underline">Manage</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate("home"); }} className="hover:underline">Research</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate("home"); }} className="hover:underline">Build</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-black font-sans mb-6">Support</h4>
              <ul className="space-y-2 text-sm text-black">
                <li><a href="#" className="hover:underline">Help Centre</a></li>
                <li><a href="#" className="hover:underline">Download and install</a></li>
                <li><a href="#" className="hover:underline">Cog Community</a></li>
                <li><a href="#" className="hover:underline">Cog Learn</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-black font-sans mb-6">Enterprise</h4>
              <ul className="space-y-2 text-sm text-black">
                <li><a href="#" className="hover:underline">Marketplace</a></li>
                <li><a href="#" className="hover:underline">Company</a></li>
                <li><a href="#" className="hover:underline">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-black font-sans mb-6">Company</h4>
              <ul className="space-y-2 text-sm text-black">
                <li><a href="#" className="hover:underline">Careers</a></li>
                <li><a href="#" className="hover:underline">Contact</a></li>
                <li><a href="#" className="hover:underline">Press</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-black py-8">
          <div className="mx-auto max-w-7xl px-[70px] flex flex-col md:flex-row justify-between items-start md:items-center text-xs text-white/80">
            <p className="uppercase tracking-[0.2em] font-medium text-[11px] font-sans text-white">
              COPYRIGHT COG CULTURE <span>{new Date().getFullYear()}</span>
            </p>
            <div className="flex gap-5 mt-4 md:mt-0">
              <a href="#" className="hover:underline uppercase tracking-[0.2em] font-medium text-[11px] font-sans text-white/80 hover:text-white">Privacy</a>
              <a href="#" className="hover:underline uppercase tracking-[0.2em] font-medium text-[11px] font-sans text-white/80 hover:text-white">Terms</a>
              <a href="#" className="hover:underline uppercase tracking-[0.2em] font-medium text-[11px] font-sans text-white/80 hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* TYPEWRITER LOADING SCREEN OVERLAY */}
      {showLoader && (
        <div
          id="typewriter-loading-overlay"
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center opacity-100 transition-opacity duration-300 select-none"
        >
          <div className="relative w-[480px] h-[160px] mx-auto select-none">
            {/* Typewriter SVG */}
            <svg width="480" height="160" viewBox="0 50 480 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
              <path d="M120 200 L90 200 C80 200 76 190 76 180 L76 164 C76 156 80 152 88 152" stroke="#d4af37" strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M88 152 L80 140" stroke="#d4af37" strokeWidth="7" strokeLinecap="round" />
              <rect x="150" y="172" width="180" height="16" rx="4" fill="#2d3748" />
              <rect x="170" y="70" width="140" height="120" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" rx="2" />
              <rect x="140" y="180" width="200" height="28" rx="4" fill="#508280" />
              <rect x="150" y="186" width="180" height="6" fill="#315755" opacity="0.5" />
              <rect x="128" y="170" width="12" height="24" rx="2" fill="#a0aec0" />
              <rect x="340" y="170" width="12" height="24" rx="2" fill="#a0aec0" />
            </svg>
            {/* Paper content */}
            <div className="absolute top-[32px] left-[180px] w-[120px] h-[95px] flex flex-col items-center justify-start overflow-hidden pt-4 px-1 text-center select-none font-mono text-[9px] font-bold text-gray-800 leading-normal">
              <div className="w-full break-words">
                <span id="typewriter-text" style={{ borderRight: "2px solid #1f2937", paddingRight: "2px", animation: "typewriter-cursor-blink 0.7s infinite step-end" }}>
                  {loaderText}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
