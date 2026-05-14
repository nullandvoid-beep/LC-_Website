import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context'
import { EditableText } from '../components/common'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Preloader } from '../components/verve/Preloader'
import { Events } from '../components/verve/Events'
import { Gallery } from '../components/verve/Gallery'
import { Team } from '../components/verve/Team'
import { VerveRegistrationModal } from '../components/verve/VerveRegistrationModal'
import { VerveAdminDashboardModal } from '../components/verve/VerveAdminDashboardModal'
import { ChevronDown } from 'lucide-react'
import Lenis from '@studio-freight/lenis'
import './verve.css'

export function VervePage() {
  const [loadingComplete, setLoadingComplete] = useState(false)

  // Dynamic Content States
  const { user } = useAuth();
  const isAdmin = user && user.role !== 'student';
  const defaultAboutText = "Verve is the Literary cum Youth Festival of NIT Durgapur, the biggest of its kind in Eastern India. We give the college an extra dimension of creative expression in the midst of technical unilateralism.\n\nExpect three days of intense debate, crazy treasure hunts, massive concerts, and unapologetic expression. We transcend the ordinary and mundane.";
  const [aboutText, setAboutText] = useState(defaultAboutText);
  const [lastEditedBy, setLastEditedBy] = useState<string | undefined>();

  const defaultAboutClubText = "In a college teeming with tech clubs and scientific student bodies, the Literary Circle prides itself in being a breath of fresh air, encouraging creativity and free thought.\n\nThe Literary Circle, through events like NITMUN, or Verve, which is East India's largest youth cum literary festival, and Literati helps students to get out of their creative cocoon, engage in healthy debate and exchange ideas among themselves. We don't just organize events; we curate experiences that challenge perspectives and celebrate the unabashed power of words.";
  const [aboutClubText, setAboutClubText] = useState(defaultAboutClubText);
  const [clubLastEditedBy, setClubLastEditedBy] = useState<string | undefined>();

  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const aboutSectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress: aboutScrollProgress } = useScroll({
    target: aboutSectionRef,
    offset: ["start start", "end end"]
  });

  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  // Dashboard Modal State
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const isLCite = user?.role === 'LCite';

  // Read More Modal State
  const [readMore, setReadMore] = useState<{ isOpen: boolean, type: 'fest' | 'club' }>({ isOpen: false, type: 'fest' });

  const handleRegisterClick = (eventId?: string) => {
    setSelectedEventId(eventId);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const docRef = doc(db, 'SiteContent', 'verve_about');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.text) setAboutText(data.text);
        setLastEditedBy(data.lastUpdatedBy);
      }

      const clubDocRef = doc(db, 'SiteContent', 'verve_about_club');
      const clubDocSnap = await getDoc(clubDocRef);
      if (clubDocSnap.exists()) {
        const clubData = clubDocSnap.data();
        if (clubData.text) setAboutClubText(clubData.text);
        setClubLastEditedBy(clubData.lastUpdatedBy);
      }
    } catch (error) {
      console.error('Error fetching dynamic content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSaveAboutText = async (newText: string) => {
    const editorName = user?.name || user?.userId || 'unknown admin';
    const docRef = doc(db, 'SiteContent', 'verve_about');
    await setDoc(docRef, {
      text: newText,
      lastUpdatedBy: editorName,
      lastUpdatedAt: new Date(),
    }, { merge: true });
    setAboutText(newText);
    setLastEditedBy(editorName);
  };

  const handleSaveAboutClubText = async (newText: string) => {
    const editorName = user?.name || user?.userId || 'unknown admin';
    const docRef = doc(db, 'SiteContent', 'verve_about_club');
    await setDoc(docRef, {
      text: newText,
      lastUpdatedBy: editorName,
      lastUpdatedAt: new Date(),
    }, { merge: true });
    setAboutClubText(newText);
    setClubLastEditedBy(editorName);
  };

  useLayoutEffect(() => {
    document.documentElement.classList.add('verve-active');
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    // @ts-ignore
    window.lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
      // @ts-ignore
      delete window.lenis;
      document.documentElement.classList.remove('verve-active');
    };
  }, []);

  return (
    <div className="verve-root">

      <AnimatePresence>
        {!loadingComplete && (
          <motion.div
            key="preloader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50"
          >
            <Preloader onComplete={() => setLoadingComplete(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`min-h-screen transition-opacity duration-1000 ${loadingComplete ? 'opacity-100' : 'opacity-0'}`}>

        {/* Navigation Bar */}
        <nav className="fixed top-0 inset-x-0 z-40 bg-verve-dark border-b-[4px] md:border-b-[6px] border-black py-4 px-6 md:px-8 shadow-[0_4px_0_#000] mix-blend-normal">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 interactive">
              <span className="text-3xl font-heading tracking-widest text-white">
                VERVE <span className="text-verve-pink">XXI</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 font-sans font-bold tracking-widest uppercase text-sm">
              <a href="#about" onClick={(e) => { e.preventDefault(); (window as any).lenis?.scrollTo('#about') }} className="hover:text-verve-gold transition-colors interactive">About</a>
              <a href="#events" onClick={(e) => { e.preventDefault(); (window as any).lenis?.scrollTo('#events') }} className="hover:text-verve-gold transition-colors interactive">Events</a>
              <a href="#team" onClick={(e) => { e.preventDefault(); (window as any).lenis?.scrollTo('#team') }} className="hover:text-verve-gold transition-colors interactive">Team</a>
              <button
                onClick={() => isLCite ? setIsDashboardOpen(true) : handleRegisterClick()}
                className="bg-verve-gold text-verve-dark px-6 py-2 brutal-border brutal-shadow hover:bg-white transition-colors font-black"
              >
                {isLCite ? 'Dashboard' : 'Register'}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative w-full h-[90vh] md:h-screen flex flex-col items-center justify-center bg-verve-dark overflow-hidden pt-20">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-verve-purple/30 to-verve-dark mix-blend-multiply" />
            {/* Soft glowing orb effect */}
            <div className="absolute top-1/4 left-[10%] w-[50vw] h-[50vw] md:w-[30vw] md:h-[30vw] bg-verve-pink/20 rounded-full blur-[100px] md:blur-[120px] mix-blend-screen animate-pulse" />
            <div className="absolute bottom-1/4 right-[10%] w-[40vw] h-[40vw] md:w-[25vw] md:h-[25vw] bg-verve-gold/20 rounded-full blur-[80px] md:blur-[100px] mix-blend-screen" />
          </div>

          <div className="relative z-10 flex flex-col items-center px-4 w-full">
            <motion.h1
              initial={{ y: -50, opacity: 0 }}
              animate={loadingComplete ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
              className="text-[18vw] md:text-[14vw] leading-[0.8] font-heading font-black text-white tracking-tighter text-center uppercase drop-shadow-2xl interactive group"
            >
              <span className="block" data-text="VERVE">VERVE</span>
              <span className="block text-verve-gold mt-2 md:mt-0" data-text="XXI">XXI</span>
            </motion.h1>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={loadingComplete ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
              className="mt-6 md:mt-8 text-xl md:text-3xl font-mono font-bold text-white tracking-widest text-center"
            >
              13<sup className="text-sm md:text-xl">TH</sup> - 15<sup className="text-sm md:text-xl">TH</sup> MARCH, 2026
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={loadingComplete ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
              transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
              className="mt-8 md:mt-10 flex flex-col md:flex-row flex-wrap justify-center gap-4 md:gap-6"
            >
              {/* Glassmorphism Stat Pills */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl interactive hover:bg-white/10 transition-colors">
                <div className="w-3 h-3 rounded-full bg-verve-pink animate-pulse shadow-[0_0_10px_#e08585]" />
                <span className="text-white font-mono text-lg md:text-xl font-medium tracking-wide">03 DAYS</span>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl interactive hover:bg-white/10 transition-colors">
                <div className="w-3 h-3 rounded-full bg-verve-gold animate-pulse shadow-[0_0_10px_#fcc201]" style={{ animationDelay: '0.5s' }} />
                <span className="text-white font-mono text-lg md:text-xl font-medium tracking-wide">MULTIPLE EVENTS</span>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl interactive hover:bg-white/10 transition-colors hidden md:flex">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_#fff]" style={{ animationDelay: '1s' }} />
                <span className="text-white font-mono text-lg md:text-xl font-medium tracking-wide">UNLIMITED MADNESS</span>
              </div>
            </motion.div>
          </div>

          {/* Scroll Down Prompt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={loadingComplete ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20"
          >
            <span className="text-white/50 font-mono text-xs uppercase tracking-widest font-bold">Scroll to Explore</span>
            <ChevronDown className="w-6 h-6 text-verve-gold animate-bounce" />
          </motion.div>
        </section>

        {/* Marquee Banner */}
        <div className="border-b-[4px] border-black bg-verve-purple py-4 overflow-hidden relative z-20 shadow-[0_4px_0_#000] interactive">
          <div className="whitespace-nowrap text-white text-3xl font-heading uppercase animate-marquee">
            {Array(15).fill('THE LITERARY CIRCLE • NIT DURGAPUR • ').join('')}
          </div>
        </div>

        {/* About Section - Continuous Scroll Reveal */}
        <section ref={aboutSectionRef} id="about" className="relative w-full h-[200vh]">
          <div className="sticky top-0 h-screen flex flex-col justify-center px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
            {/* We'll use local scroll progress for the crossfade effect inside this About wrapper */}
            <AboutSectionContent
              scrollYProgress={aboutScrollProgress}
              isAdmin={isAdmin}
              aboutText={aboutText}
              handleSaveAboutText={handleSaveAboutText}
              lastEditedBy={lastEditedBy}
              aboutClubText={aboutClubText}
              handleSaveAboutClubText={handleSaveAboutClubText}
              clubLastEditedBy={clubLastEditedBy}
              isLoadingContent={isLoadingContent}
              onReadMore={(type: 'fest' | 'club') => setReadMore({ isOpen: true, type })}
            />
            {/* Scroll Down Prompt for About */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={loadingComplete ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20"
            >
              <span className="text-white/50 font-mono text-xs uppercase tracking-widest font-bold">Keep Scrolling</span>
              <ChevronDown className="w-6 h-6 text-verve-gold animate-bounce" />
            </motion.div>
          </div>
        </section>

        <Events onRegisterClick={(eventId) => isLCite ? setIsDashboardOpen(true) : handleRegisterClick(eventId)} />
        <Gallery />
        <Team />

        {/* Massive Footer enabling full scroll of Team cards */}
        <section className="relative w-full min-h-[50vh] bg-verve-dark border-b-[8px] border-black flex flex-col items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-5xl md:text-8xl lg:text-[10rem] font-heading font-black uppercase text-white tracking-tighter leading-none mb-6">
              READY?
            </h2>
            <button
              onClick={() => isLCite ? setIsDashboardOpen(true) : handleRegisterClick()}
              className="bg-verve-gold text-verve-dark px-12 py-5 text-xl md:text-3xl font-heading font-bold brutal-border hover:bg-white transition-colors interactive shadow-[0_8px_0_#000]"
            >
              {isLCite ? 'VIEW DASHBOARD' : 'SECURE YOUR SPOT'}
            </button>
            <p className="mt-12 font-mono text-white/50 text-sm uppercase tracking-widest">
              The Literary Circle © 2026
            </p>
          </div>
        </section>

      </div>

      <VerveRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialEventId={selectedEventId}
      />

      <VerveAdminDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />

      {/* Read More Modal */}
      <AnimatePresence>
        {readMore.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md"
            data-lenis-prevent="true"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-3xl max-h-[85vh] md:max-h-[80vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden border-2 flex-grow ${readMore.type === 'fest' ? 'bg-verve-dark border-white/10' : 'bg-verve-gold border-black/10'}`}
            >
              {/* Modal Header */}
              <div className={`flex justify-between items-center p-6 md:p-8 border-b shrink-0 ${readMore.type === 'fest' ? 'border-white/10' : 'border-black/10'}`}>
                <h3 className={`text-2xl md:text-3xl lg:text-4xl font-heading uppercase tracking-wider ${readMore.type === 'fest' ? 'text-verve-gold' : 'text-black'}`}>
                  {readMore.type === 'fest' ? "The Fest Manifesto" : "The Club Manifesto"}
                </h3>
                <button
                  onClick={() => setReadMore({ ...readMore, isOpen: false })}
                  className={`p-2 rounded-full transition-colors ${readMore.type === 'fest' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto hide-scrollbar flex-1">
                <div className={`font-mono leading-relaxed whitespace-pre-wrap text-sm md:text-base h-full ${readMore.type === 'fest' ? 'text-white/80' : 'text-black/80'}`}>
                  {readMore.type === 'fest' ? (
                    <EditableText
                      value={aboutText}
                      onSave={handleSaveAboutText}
                      canEdit={Boolean(isAdmin)}
                      className={`font-mono p-4 rounded-xl border border-transparent transition-colors ${isAdmin ? 'hover:border-verve-gold/50 bg-white/5' : ''}`}
                      showLastEdited={Boolean(isAdmin)}
                      lastEditedBy={lastEditedBy}
                    />
                  ) : (
                    <EditableText
                      value={aboutClubText}
                      onSave={handleSaveAboutClubText}
                      canEdit={Boolean(isAdmin)}
                      className={`font-mono p-4 rounded-xl border border-transparent transition-colors ${isAdmin ? 'hover:border-black/50 bg-black/5' : ''} !text-black`}
                      showLastEdited={Boolean(isAdmin)}
                      lastEditedBy={clubLastEditedBy}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AboutSectionContent({ scrollYProgress, isAdmin, aboutText, handleSaveAboutText, isLoadingContent, aboutClubText, handleSaveAboutClubText, onReadMore }: any) {
  // Determine widths
  const yellowWidth = useTransform(scrollYProgress, [0.2, 0.8], ["15%", "85%"]);
  const darkWidth = useTransform(scrollYProgress, [0.2, 0.8], ["85%", "15%"]);

  // Opacities for the full content
  const yellowContentOpacity = useTransform(scrollYProgress, [0.4, 0.8], [0, 1]);
  const darkContentOpacity = useTransform(scrollYProgress, [0.2, 0.6], [1, 0]);

  // Opacities for the vertical minimalist titles when compressed
  const yellowTitleOpacity = useTransform(scrollYProgress, [0.2, 0.4], [1, 0]);
  const darkTitleOpacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);

  return (
    <>
      <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
        <div className="flex w-full max-w-[95vw] lg:max-w-7xl h-[75vh] md:h-[600px] xl:h-[700px] gap-3 md:gap-6 items-center justify-center px-2 md:px-8">

          {/* State 1: About Verve (LEFT, DARK, SHRINKS) */}
          <motion.div
            style={{ width: darkWidth }}
            className="h-full bg-verve-dark/80 backdrop-blur-xl border-2 border-white/10 rounded-[2rem] p-4 md:p-8 lg:p-12 relative overflow-hidden group interactive flex flex-col justify-center shadow-2xl origin-left"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-verve-pink/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-verve-pink/20 transition-colors duration-700 pointer-events-none" />

            {/* Compressed Vertical Title */}
            <motion.div
              style={{ opacity: darkTitleOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <h2 className="text-4xl lg:text-5xl font-heading text-verve-gold uppercase tracking-wide -rotate-90 whitespace-nowrap origin-center">
                01 // THE FEST
              </h2>
            </motion.div>

            {/* Full Expanded Content */}
            <motion.div
              style={{ opacity: darkContentOpacity }}
              className="absolute inset-y-0 left-0 w-[78vw] md:w-[70vw] lg:w-[55vw] max-w-[800px] px-6 py-12 md:p-12 pb-12 flex flex-col justify-start md:justify-center items-start overflow-hidden"
              data-lenis-prevent="true"
            >
              <div className="inline-block px-4 py-2 rounded-full bg-verve-gold/20 text-verve-gold font-sans font-bold text-xs tracking-wider mb-4 md:mb-8 shrink-0">
                01 // THE FEST
              </div>
              <h2 className="text-[1.75rem] leading-none sm:text-4xl md:text-5xl lg:text-7xl font-heading text-white uppercase tracking-wide mb-4 md:mb-8 interactive w-full break-words shrink-0">
                Eastern India's <span className="text-verve-pink">Largest</span>
              </h2>
              <div className="text-sm md:text-lg font-mono leading-relaxed text-white/80 w-[95%] md:w-full max-w-2xl whitespace-normal break-words shrink-0 relative flex-1 min-h-0 flex flex-col">
                {isLoadingContent ? (
                  <p className="animate-pulse">Loading content...</p>
                ) : (
                  <>
                    <div className="relative overflow-hidden md:overflow-y-auto flex-1 mask-bottom md:mask-none md:pb-12 hide-scrollbar">
                      <EditableText
                        value={aboutText}
                        onSave={handleSaveAboutText}
                        canEdit={Boolean(isAdmin)}
                        className="font-mono bg-white/5 p-3 md:p-4 rounded-xl border border-white/5 hover:border-verve-gold/50 transition-colors whitespace-pre-wrap inline-block pointer-events-none md:pointer-events-auto md:w-full"
                        showLastEdited={false}
                        lastEditedBy={undefined}
                      />
                      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#141619] via-[#141619]/80 to-transparent pointer-events-none md:hidden" />
                    </div>
                    <button
                      onClick={() => onReadMore('fest')}
                      className="mt-2 group interactive flex md:hidden items-center gap-2 text-sm md:text-base font-heading text-verve-gold hover:text-white transition-colors pointer-events-auto shrink-0 w-max z-10 relative bg-[#141619] pr-4 pt-2"
                    >
                      ...READ MORE
                      <span className="block w-6 h-[2px] bg-verve-gold group-hover:w-10 group-hover:bg-white transition-all duration-300" />
                    </button>
                    {isAdmin && (
                      <p className="text-xs text-verve-gold mt-2 font-sans font-bold uppercase tracking-wider block pl-3 border-l-2 border-verve-gold shrink-0 md:hidden">
                        Admin: Click 'Read More' to edit
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* State 2: About Literary Circle (RIGHT, YELLOW, EXPANDS) */}
          <motion.div
            style={{ width: yellowWidth }}
            className="h-full bg-verve-gold rounded-[2rem] p-4 md:p-8 lg:p-12 relative overflow-hidden group interactive flex flex-col justify-center shadow-2xl origin-right"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

            {/* Compressed Vertical Title */}
            <motion.div
              style={{ opacity: yellowTitleOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <h2 className="text-4xl lg:text-5xl font-heading text-black uppercase tracking-wide -rotate-90 whitespace-nowrap origin-center">
                02 // THE CLUB
              </h2>
            </motion.div>

            {/* Full Expanded Content */}
            <motion.div
              style={{ opacity: yellowContentOpacity }}
              className="absolute inset-y-0 left-0 w-[78vw] md:w-[70vw] lg:w-[55vw] max-w-[800px] px-6 py-12 md:p-12 pb-12 flex flex-col justify-start md:justify-center items-start overflow-hidden"
              data-lenis-prevent="true"
            >
              <div className="inline-block px-4 py-2 rounded-full bg-black/10 text-black font-sans font-bold text-xs tracking-wider mb-4 md:mb-8 shrink-0">
                02 // THE CLUB
              </div>
              <h2 className="text-[1.75rem] leading-none sm:text-4xl md:text-5xl lg:text-7xl font-heading text-black uppercase tracking-wide mb-4 md:mb-8 interactive w-full break-words shrink-0">
                The Literary <br className="block md:hidden" /> Circle
              </h2>
              <div className="text-sm md:text-lg font-mono leading-relaxed text-black/80 w-[95%] md:w-full max-w-2xl whitespace-normal break-words shrink-0 relative flex-1 min-h-0 flex flex-col">
                {isLoadingContent ? (
                  <p className="animate-pulse">Loading content...</p>
                ) : (
                  <>
                    <div className="relative overflow-hidden md:overflow-y-auto flex-1 mask-bottom md:mask-none md:pb-12 hide-scrollbar">
                      <EditableText
                        value={aboutClubText}
                        onSave={handleSaveAboutClubText}
                        canEdit={Boolean(isAdmin)}
                        className="font-mono bg-black/5 p-3 md:p-4 rounded-xl border border-black/5 hover:border-black/50 transition-colors whitespace-pre-wrap inline-block w-full !text-black pointer-events-none md:pointer-events-auto"
                        showLastEdited={false}
                        lastEditedBy={undefined}
                      />
                      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-verve-gold via-verve-gold/80 to-transparent pointer-events-none md:hidden" />
                    </div>
                    <button
                      onClick={() => onReadMore('club')}
                      className="mt-2 group interactive flex md:hidden items-center gap-2 text-sm md:text-base font-heading text-black hover:text-black/60 transition-colors pointer-events-auto shrink-0 w-max z-10 relative bg-verve-gold pr-4 pt-2"
                    >
                      ...READ MORE
                      <span className="block w-6 h-[2px] bg-black group-hover:w-10 group-hover:bg-black/60 transition-all duration-300" />
                    </button>
                    {isAdmin && (
                      <p className="text-xs text-black mt-2 font-sans font-bold uppercase tracking-wider block pl-3 border-l-2 border-black shrink-0 md:hidden">
                        Admin: Click 'Read More' to edit
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

    </>
  );
}
