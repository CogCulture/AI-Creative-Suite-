import { useState, useEffect, useRef } from "react";

export default function LandingPage({ onLogin, onNavigate, autoTriggerLogin }) {
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

  // --- Suite Interactive Tabs ---
  const [activeSuiteIdx, setActiveSuiteIdx] = useState(0);
  const suiteIntervalRef = useRef(null);

  // --- Customer Testimonials Slider ---
  const [customerActiveIdx, setCustomerActiveIdx] = useState(3);
  const [sliderTransition, setSliderTransition] = useState(true);
  const customerTrackRef = useRef(null);
  const customerIntervalRef = useRef(null);

  // --- FAQ State ---
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // --- Onboarding autoTriggerLogin ---
  useEffect(() => {
    if (autoTriggerLogin) {
      onNavigate("login");
    }
  }, [autoTriggerLogin]);

  // --- Suite Tab Cycles ---
  useEffect(() => {
    const cycleSuite = () => {
      setActiveSuiteIdx((prev) => (prev + 1) % 4);
    };
    suiteIntervalRef.current = setInterval(cycleSuite, 5000);
    return () => clearInterval(suiteIntervalRef.current);
  }, []);

  const handleSuiteTabClick = (idx) => {
    clearInterval(suiteIntervalRef.current);
    setActiveSuiteIdx(idx);
    suiteIntervalRef.current = setInterval(() => {
      setActiveSuiteIdx((prev) => (prev + 1) % 4);
    }, 5000);
  };

  // --- Customer Slider Carousel Auto Play ---
  useEffect(() => {
    const nextSlide = () => {
      setCustomerActiveIdx((prev) => prev + 1);
      setSliderTransition(true);
    };
    customerIntervalRef.current = setInterval(nextSlide, 3000);
    return () => clearInterval(customerIntervalRef.current);
  }, []);

  // --- Customer Slider TransitionEnd wrap ---
  const handleTransitionEnd = () => {
    if (customerActiveIdx >= 6) {
      setSliderTransition(false);
      setCustomerActiveIdx(3);
    } else if (customerActiveIdx <= 0) {
      setSliderTransition(false);
      setCustomerActiveIdx(3);
    }
  };

  // --- Typewriter Loader execution ---
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

  const suiteTabs = [
    { name: "Create", desc: "Generate original content across every creative medium from visuals to motion, writing, and beyond." },
    { name: "Manage", desc: "Craft polished digital experiences, brand assets, interfaces, and layouts with intelligent design tools." },
    { name: "Research", desc: "Transform ideas into fully functional websites, apps, and interactive products without starting from scratch." },
    { name: "Build", desc: "Develop strategies, optimize discoverability, and accelerate growth with AI-powered insights." }
  ];

  const faqs = [
    { q: "What is Cog Culture?", a: "Cog Culture is an all-in-one AI suite that helps you create images, videos, copy, presentations, websites and apps — without juggling a dozen different tools." },
    { q: "Do I need any design or coding skills?", a: "Not at all. If you can describe what you want, Cog Culture can make it. Everything is built for beginners, with plenty of room for pros to go deeper." },
    { q: "Can I try it for free?", a: "Yes. Every plan starts with a free trial so you can explore the full suite before you commit." },
    { q: "Is my work and data private?", a: "Always. Your prompts, files and brand assets stay yours. We never train public models on your private content." },
    { q: "Does it work for teams?", a: "Yes. Invite teammates, share brand kits and collaborate in real time on any project across the suite." },
    { q: "Can I cancel anytime?", a: "Of course. Plans are month-to-month and you can upgrade, downgrade or cancel whenever you like." }
  ];

  // Helper to handle video play on hover for workflow cards
  const playVideoOnHover = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video) {
      video.play().catch((err) => console.log("Video play error:", err));
    }
  };

  const pauseVideoOnLeave = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video) {
      video.pause();
    }
  };

  return (
    <div className="landing-page-root bg-white text-ink font-sans overflow-x-hidden min-h-screen">

      {/* HERO */}
      <section className="relative bg-white pt-16 pb-6">
        <div className="spectrum-rainbow-top"></div>
        <div className="spectrum-glow spectrum-glow-rainbow w-[650px] h-[650px] -top-[150px] -right-[150px] opacity-35"></div>
        <div className="spectrum-glow spectrum-glow-rainbow w-[450px] h-[450px] top-[120px] -left-[150px] opacity-25"></div>
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-[70px] lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-1">
            <h1 className="text-3xl font-medium leading-[1.05] tracking-tight md:text-5xl font-display text-ink">
              One AI suite.<br /><span className="text-brand">Infinite ways to create.</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted font-sans">
              Turn ideas into images, videos, copy, presentations, websites and apps all from one simple place. No new skills to learn. Just describe what you want, and start creating.
            </p>
            <div className="mt-8 flex gap-3 max-w-[380px] w-full">
              <button
                onClick={triggerLoginTransition}
                className="group/btn inline-flex items-center justify-center gap-2 rounded-none bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.03] active:scale-[0.98] hover:shadow-md hover:brightness-110 w-1/2 whitespace-nowrap"
              >
                <span>Start free trial</span>
                <span className="transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
              </button>
              <a
                href="#suite"
                className="inline-flex items-center justify-center rounded-none border-[0.5px] border-black bg-white px-4 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:bg-[#dddddd] w-1/2 whitespace-nowrap text-center"
              >
                Explore the suite
              </a>
            </div>
            <p className="mt-4 text-xs text-muted font-sans">Free 14-day trial · No credit card required</p>
          </div>
          <div className="lg:col-span-2">
            <video src="/videos/Banner-low.mp4" autoPlay loop muted playsInline className="border border-border w-full h-auto object-cover"></video>
          </div>
        </div>
        <div className="relative z-10" style={{ overflow: "hidden", padding: "36px 0 0 0" }}>
          <div style={{ display: "flex", width: "max-content" }} className="animate-slide-continuous">
            <img src="/images/Logos@3x.png" alt="Logo" style={{ height: "80px", width: "auto", flexShrink: 0, display: "block" }} />
            <img src="/images/Logos@3x.png" alt="Logo" style={{ height: "80px", width: "auto", flexShrink: 0, display: "block" }} />
            <img src="/images/Logos@3x.png" alt="Logo" style={{ height: "80px", width: "auto", flexShrink: 0, display: "block" }} />
            <img src="/images/Logos@3x.png" alt="Logo" style={{ height: "80px", width: "auto", flexShrink: 0, display: "block" }} />
          </div>
        </div>
      </section>

      {/* SUITE SECTION */}
      <section id="suite" className="relative bg-white pt-10 pb-16">
        <div className="spectrum-glow spectrum-glow-rainbow w-[450px] h-[450px] top-[10%] -left-[180px] opacity-25"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-[70px]">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">AI INTELLIGENCE SUITE</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">The AI Creative Suite for Everything You Create</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[7px] bg-white items-stretch border border-border overflow-hidden lg:h-[480px]">
            {/* Tabs */}
            <div className="lg:col-span-3 bg-[#dddddd] p-8 lg:p-12 space-y-6 flex flex-col justify-center">
              {suiteTabs.map((tab, i) => (
                <div key={i} className={`suite-tab group cursor-pointer ${activeSuiteIdx === i ? "active" : ""}`} onClick={() => handleSuiteTabClick(i)}>
                  <h3 className="text-lg font-semibold font-display text-ink transition-colors duration-200">{tab.name}</h3>
                  {activeSuiteIdx === i && (
                    <div className="suite-tab-content" style={{ maxHeight: "200px", opacity: 1 }}>
                      <p className="mt-2 text-sm leading-relaxed text-muted font-sans">{tab.desc}</p>
                      <a href="#" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/80 hover:text-ink transition-colors duration-200">
                        <span>Explore {tab.name}</span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </a>
                    </div>
                  )}
                  <div className="mt-4 w-[180px] h-[1px] bg-[#c0c0c0] relative">
                    <div
                      className="suite-progress absolute left-0 bg-black"
                      style={{
                        height: "2px",
                        top: "-0.5px",
                        width: activeSuiteIdx === i ? "100%" : "0%",
                        transition: activeSuiteIdx === i ? "width 5s linear" : "none"
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Video pane */}
            <div className="lg:col-span-9 w-full flex items-center justify-center bg-black">
              <video id="suite-video" autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/videos/2nd video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW CARDS */}
      <section className="relative bg-white py-16">
        <div className="spectrum-glow spectrum-glow-rainbow w-[450px] h-[450px] top-[15%] -right-[180px] opacity-25"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-[70px]">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">BUILT FOR THE WAY YOU WORK</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">
              Less juggling tools.<br className="hidden sm:inline" />More making things.
            </h2>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-[7px] max-w-[1150px] mx-auto">
            {/* Card 1 */}
            <div
              onMouseEnter={playVideoOnHover}
              onMouseLeave={pauseVideoOnLeave}
              className="workflow-card group hover:shadow-lg flex flex-col shrink-0 text-left items-start overflow-hidden bg-white border border-border"
            >
              <div className="px-5 pt-5 pb-3 w-full">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">For Creators</h3>
              </div>
              <div className="w-full h-[340px] bg-transparent overflow-hidden">
                <video src="/videos/cosmos_162575666.mp4" loop muted playsInline className="w-full h-full object-cover"></video>
              </div>
              <div className="px-5 pt-4 pb-5 w-full flex-grow flex flex-col justify-start overflow-hidden">
                <h4 className="text-lg font-semibold font-display mb-2 w-full">Make more, faster without the busywork.</h4>
                <p className="text-sm leading-relaxed text-muted font-sans">Create, refine, and ship faster with connected tools and reusable brand assets that keep every project consistent.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onMouseEnter={playVideoOnHover}
              onMouseLeave={pauseVideoOnLeave}
              className="workflow-card group hover:shadow-lg flex flex-col shrink-0 text-left items-start overflow-hidden bg-white border border-border"
            >
              <div className="px-5 pt-5 pb-3 w-full">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">For Marketers</h3>
              </div>
              <div className="w-full h-[340px] bg-transparent overflow-hidden">
                <video src="/videos/101010.mp4" loop muted playsInline className="w-full h-full object-cover"></video>
              </div>
              <div className="px-5 pt-4 pb-5 w-full flex-grow flex flex-col justify-start overflow-hidden">
                <h4 className="text-lg font-semibold font-display mb-2 w-full">Launch campaigns in days, not months.</h4>
                <p className="text-sm leading-relaxed text-muted font-sans">Launch complete campaigns faster, test winning variations instantly, and keep every message perfectly on-brand.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onMouseEnter={playVideoOnHover}
              onMouseLeave={pauseVideoOnLeave}
              className="workflow-card group hover:shadow-lg flex flex-col shrink-0 text-left items-start overflow-hidden bg-white border border-border"
            >
              <div className="px-5 pt-5 pb-3 w-full">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">For Teams</h3>
              </div>
              <div className="w-full h-[340px] bg-transparent overflow-hidden">
                <video src="/videos/123456.mp4" loop muted playsInline className="w-full h-full object-cover"></video>
              </div>
              <div className="px-5 pt-4 pb-5 w-full flex-grow flex flex-col justify-start overflow-hidden">
                <h4 className="text-lg font-semibold font-display mb-2 w-full">One workspace your whole team will love.</h4>
                <p className="text-sm leading-relaxed text-muted font-sans">Collaborate in real time, stay organized with roles and permissions, and keep every version and approval in one place.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={() => onNavigate("pricing")}
              className="group/btn inline-flex items-center justify-center gap-2 rounded-none bg-brand px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.03] active:scale-[0.98] hover:shadow-md hover:brightness-110"
            >
              <span>See how it works</span>
              <span className="transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* CUSTOMERS CAROUSEL */}
      <section className="relative bg-[#dddddd] py-16">
        <div className="spectrum-glow spectrum-glow-rainbow w-[400px] h-[400px] top-[10%] -left-[150px] opacity-20 mix-blend-multiply"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-[70px]">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">OUR CUSTOMERS</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">Why ambitious brands choose Cog Culture</h2>
          </div>

          <div className="relative w-full overflow-hidden" id="customer-slider-container">
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-[#dddddd] to-transparent"></div>
            <div
              className="flex gap-6"
              style={{ animation: "marqueeScroll 18s linear infinite" }}
            >
              {/* Set 1 */}
              <div className="flex-shrink-0 w-[340px] aspect-[2/1] overflow-hidden"><img src="/images/bb.png" alt="Bharti" className="w-full h-full object-cover" /></div>
              <div className="flex-shrink-0 w-[340px] aspect-[2/1] overflow-hidden"><img src="/images/pp.png" alt="Panasonic" className="w-full h-full object-cover" /></div>
              <div className="flex-shrink-0 w-[340px] aspect-[2/1] overflow-hidden"><img src="/images/cp.png" alt="Cashfree" className="w-full h-full object-cover" /></div>
              {/* Set 2 — duplicate for seamless loop */}
              <div className="flex-shrink-0 w-[340px] aspect-[2/1] overflow-hidden"><img src="/images/bb.png" alt="Bharti" className="w-full h-full object-cover" /></div>
              <div className="flex-shrink-0 w-[340px] aspect-[2/1] overflow-hidden"><img src="/images/pp.png" alt="Panasonic" className="w-full h-full object-cover" /></div>
              <div className="flex-shrink-0 w-[340px] aspect-[2/1] overflow-hidden"><img src="/images/cp.png" alt="Cashfree" className="w-full h-full object-cover" /></div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-[#dddddd] to-transparent"></div>
          </div>
        </div>
      </section>

      {/* BRAND SAFETY / ENTERPRISE */}
      <section id="enterprise" className="relative bg-white py-16">
        <div className="spectrum-glow spectrum-glow-rainbow w-[450px] h-[450px] top-[10%] -right-[180px] opacity-25"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-[70px]">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">MADE FOR YOUR BRAND</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">AI that knows your brand and respects your data.</h2>
            <p className="mt-6 text-sm leading-relaxed text-muted font-sans mx-auto max-w-2xl">Upload your logos, fonts, colors and tone of voice once. Every image, video and word Cog Culture creates will feel unmistakably yours.</p>
            <div className="mt-8 flex justify-center">
              <button
                onClick={triggerLoginTransition}
                className="group/btn inline-flex items-center justify-center gap-2 rounded-none bg-brand px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.03] active:scale-[0.98] hover:shadow-md hover:brightness-110"
              >
                <span>Talk to our team</span>
                <span className="transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
              </button>
            </div>
          </div>

          <div className="grid gap-12 sm:grid-cols-3 mt-16 max-w-5xl mx-auto w-full">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 text-black">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 11 11 13 15 9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold font-display text-ink mb-2">Data Ownership</h3>
              <p className="text-sm leading-relaxed text-muted font-sans">Your work stays yours. Always.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 text-black">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="6" height="6" rx="1" />
                  <rect x="15" y="3" width="6" height="6" rx="1" />
                  <rect x="9" y="15" width="6" height="6" rx="1" />
                  <path d="M6 9v3h12V9" />
                  <path d="M12 12v-3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold font-display text-ink mb-2">Brand Alignment</h3>
              <p className="text-sm leading-relaxed text-muted font-sans">Trained on your brand, not the open internet.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 text-black">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <line x1="17.5" y1="15" x2="17.5" y2="20" />
                  <line x1="15" y1="17.5" x2="20" y2="17.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold font-display text-ink mb-2">Enterprise Security</h3>
              <p className="text-sm leading-relaxed text-muted font-sans">Enterprise-grade security, ready when you scale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="relative bg-white py-16">
        <div className="spectrum-glow spectrum-glow-rainbow w-[450px] h-[450px] top-[15%] -left-[180px] opacity-25"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-[70px]">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">RESOURCES</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">Learn, get inspired, and level up.</h2>
          </div>
          <div className="grid gap-[7px] md:grid-cols-3">
            <a href="#" className="group overflow-hidden bg-transparent border-[0.5px] border-[#16192b]/25 hover:border-[#16192b]/60 transition duration-300">
              <div className="aspect-[16/10]"><video src="/videos/cosmos_396628657.mp4" autoPlay muted loop className="w-full h-full object-cover"></video></div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Guide</p>
                <h3 className="mt-2 text-lg font-semibold font-display text-ink">How to brief AI like a creative director</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted font-sans">5 prompts that make every <br />generation 10x better.</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:text-brand">Read more →</div>
              </div>
            </a>
            <a href="#" className="group overflow-hidden bg-transparent border-[0.5px] border-[#16192b]/25 hover:border-[#16192b]/60 transition duration-300">
              <div className="aspect-[16/10]"><img src="/images/cosmos_953824387.gif" alt="Story" className="w-full h-full object-cover" /></div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Story</p>
                <h3 className="mt-2 text-lg font-semibold font-display text-ink">From idea to launched product in 9 days</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted font-sans">How one founder used the full <br />Cog Culture suite.</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:text-brand">Read more →</div>
              </div>
            </a>
            <a href="#" className="group overflow-hidden bg-transparent border-[0.5px] border-[#16192b]/25 hover:border-[#16192b]/60 transition duration-300">
              <div className="aspect-[16/10]"><video src="/videos/cosmos_850585915.mp4" autoPlay muted loop className="w-full h-full object-cover"></video></div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Playbook</p>
                <h3 className="mt-2 text-lg font-semibold font-display text-ink">The new marketing stack, simplified</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted font-sans">Replace the patchwork. Move <br />faster as a team.</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:text-brand">Read more →</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative bg-white py-16">
        <div className="spectrum-glow spectrum-glow-rainbow w-[450px] h-[450px] top-[10%] -right-[180px] opacity-25"></div>
        <div className="relative z-10 mx-auto max-w-6xl px-[70px]">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">FAQ</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-5xl font-display text-ink">Questions? We have answers.</h2>
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

      {/* CTA */}
      <section className="relative overflow-hidden py-16 text-center text-white">
        <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "right", zIndex: 0 }} src="/videos/1234567.mp4"></video>
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,12,28,0.60)", zIndex: 1 }}></div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: "720px", margin: "0 auto", padding: "0 70px" }}>
          <h2 className="text-3xl font-medium tracking-tight md:text-5xl font-display text-white">Ready to make something great?</h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/85 font-sans">Join thousands of creators and teams already building faster with Cog Culture. Your first 14 days are on us.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={triggerLoginTransition}
              className="inline-flex items-center justify-center rounded-none border-[0.5px] border-black bg-white px-10 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:bg-[#dddddd]"
            >
              Start free trial
            </button>
            <button
              onClick={() => onNavigate("pricing")}
              className="rounded-none border border-white/30 px-10 py-3 text-sm font-semibold text-white hover:bg-white/10 transition bg-transparent"
            >
              See pricing
            </button>
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
                <li><a href="#" className="hover:underline">Create</a></li>
                <li><a href="#" className="hover:underline">Manage</a></li>
                <li><a href="#" className="hover:underline">Research</a></li>
                <li><a href="#" className="hover:underline">Build</a></li>
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
            <p className="uppercase tracking-[0.2em] font-medium text-[11px] font-sans text-white">COPYRIGHT COG CULTURE <span>{new Date().getFullYear()}</span></p>
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
