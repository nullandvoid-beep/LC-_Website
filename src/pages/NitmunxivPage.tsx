import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { EditableText } from '../components/common';
import nitmunxivvideo from '../assets/nitmunxiv/nitmunxiv-video.mp4';
import nitmunxivDesktopVideo from '../assets/nitmunxiv/nitmunxiv-desktop-video.mp4';
import nitmunxivLogo from '../assets/nitmunxiv/nitmunxiv-logo.png';
import { NitmunRegistrationModal } from '../components/nitmun/InorOut';
import { useAuth } from '../context';
import { NitmunAdminPanel } from '../components/nitmun/NitmunAdminPanel';
import { StudyGuidesModal } from '../components/nitmun/StudyGuidesModal';
import { PhotoGalleryModal } from '../components/nitmun/PhotoGalleryModal';
import { CommitteeAIAssistant } from '../components/nitmun/CommitteeAIAssistant';
import { Shield, ChevronDown, BookOpen, Image as ImageIcon } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
const TARGET_DATE = new Date('2026-03-07T00:00:00+05:30').getTime();

const MarqueeBackground = () => {
  const row1 = Array(15).fill('LITERARY CIRCLE • NITMUN XIV • ').join('');
  const row2 = Array(15).fill('UNITED NATIONS GENERAL ASSEMBLY • DELEGATE • ').join('');
  const row3 = Array(15).fill('ALL INDIA POLITICAL PARTIES MEET • CAUCUS • ').join('');
  const row4 = Array(15).fill('UNITED NATIONS HUMAN RIGHTS COUNCIL • RESOLUTION • ').join('');
  const row5 = Array(15).fill('INTERNATIONAL PRESS • DIPLOMACY • LITERARY CIRCLE • ').join('');

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.12] z-0 select-none flex flex-col justify-around py-32">
      <div className="whitespace-nowrap text-[#bb943a] text-5xl md:text-7xl font-staatliches uppercase animate-marquee">
        {row1}
      </div>
      <div className="whitespace-nowrap text-[#e08585] text-5xl md:text-7xl font-staatliches uppercase animate-marquee-slow">
        {row2}
      </div>
      <div className="whitespace-nowrap text-[#e0b0ac] text-5xl md:text-7xl font-staatliches uppercase animate-marquee-slower">
        {row3}
      </div>
      <div className="whitespace-nowrap text-[#c58715] text-5xl md:text-7xl font-staatliches uppercase animate-marquee-slow">
        {row4}
      </div>
      <div className="whitespace-nowrap text-[#974B60] text-5xl md:text-7xl font-staatliches uppercase animate-marquee whitespace-nowrap">
        {row5}
      </div>
    </div>
  );
};

export function NitmunxivPage() {
  const [showModal, setShowModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showStudyGuides, setShowStudyGuides] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showBotIntruderAlert, setShowBotIntruderAlert] = useState(false);
  const [preselectedCommittee, setPreselectedCommittee] = useState<string>('');
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const actionButtonsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const userEmailLower = user?.email?.toLowerCase() || '';
  const isInhouseUser = userEmailLower.endsWith('@nitdgp.ac.in') || userEmailLower.endsWith('@btech.nitdgp.ac.in');

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const isAdmin = user && user.role !== 'student';
  const { scrollYProgress } = useScroll();
  const videoOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Dynamic Content States
  const defaultTlcText = `Literary Circle is the oldest club of NIT Durgapur, which gives the college an extra dimension of creative expression in the midst of technical unilateralism and gives the students of the college an opportunity to transcend the ordinary and mundane.\n\nThe Literary Circle conducts various events throughout the year: Verve, Literary cum Youth Festival of the college and the biggest of its kind in Eastern India. The Literary Circle successfully pulled off the 20th edition of Verve in 2025. Flagship events in the fest, like the Treasure Hunt, have become a matter of college folklore.\n\nThe club maintains a blog, The Darkest White, as the culmination of myriad pen strokes from the collective literary expression of the college. The club publishes the yearbook, so each student graduating out of college can reminisce about their days in the college, their hostel life and take with them a part of it.\n\nHumans of NIT Durgapur, by The Literary Circle, captures the untold stories, legends, and experiences of individuals, showing our readers how ordinary people can be unique, inspirational and relatable. The TEDx is an initiative where influential speakers are invited in order to realise TED's overall mission to research and discover "Touchstones". TEDxNITDurgapur was co-organised by The Literary Circle and was a confluence of ideas and innovation.\n\nThe club is known to be highly selective in its admission of new members, with only about 10-15 students inducted out of the entire batch of 900 each year. Great believers of the phrase 'quality over quantity', the members selected every year are the best in the field of expression and creativity.`;

  const defaultNitmunText = `NITMUN is a forum convened by the members of the Literary Circle for discussion and analysis of global issues. It seeks to bring out motivated delegates from all over the country for a meaningful debate on significant international issues.\n\nCurrently, in its 14th edition, NITMUN has been extremely successful in providing the perfect experience to each delegate. Over the years, we have entertained more than 2000 delegates totalling all the editions. Delegates arrive from all corners of India for an experience they will never forget.`;

  const [aboutTlcText, setAboutTlcText] = useState(defaultTlcText);
  const [lastEditedTlcBy, setLastEditedTlcBy] = useState<string | undefined>();
  const [aboutNitmunText, setAboutNitmunText] = useState(defaultNitmunText);
  const [lastEditedNitmunBy, setLastEditedNitmunBy] = useState<string | undefined>();
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const tlcDocRef = doc(db, 'SiteContent', 'nitmun_about_tlc');
      const tlcDocSnap = await getDoc(tlcDocRef);
      if (tlcDocSnap.exists()) {
        const data = tlcDocSnap.data();
        if (data.text) setAboutTlcText(data.text);
        setLastEditedTlcBy(data.lastUpdatedBy);
      }

      const nitmunDocRef = doc(db, 'SiteContent', 'nitmun_about');
      const nitmunDocSnap = await getDoc(nitmunDocRef);
      if (nitmunDocSnap.exists()) {
        const data = nitmunDocSnap.data();
        if (data.text) setAboutNitmunText(data.text);
        setLastEditedNitmunBy(data.lastUpdatedBy);
      }
    } catch (error) {
      console.error('Error fetching dynamic content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSaveTlcText = async (newText: string) => {
    const editorName = user?.name || user?.userId || 'unknown admin';
    const docRef = doc(db, 'SiteContent', 'nitmun_about_tlc');
    await setDoc(docRef, {
      text: newText,
      lastUpdatedBy: editorName,
      lastUpdatedAt: new Date(),
    }, { merge: true });
    setAboutTlcText(newText);
    setLastEditedTlcBy(editorName);
  };

  const handleSaveNitmunText = async (newText: string) => {
    const editorName = user?.name || user?.userId || 'unknown admin';
    const docRef = doc(db, 'SiteContent', 'nitmun_about');
    await setDoc(docRef, {
      text: newText,
      lastUpdatedBy: editorName,
      lastUpdatedAt: new Date(),
    }, { merge: true });
    setAboutNitmunText(newText);
    setLastEditedNitmunBy(editorName);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = TARGET_DATE - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isVideoFinished) {
      const scrollTimer = setTimeout(() => {
        if (actionButtonsRef.current) {
          const isMobile = window.innerWidth < 768;
          const scrollOffset = isMobile ? 20 : -100;
          const y = actionButtonsRef.current.getBoundingClientRect().top + window.scrollY + scrollOffset;
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });
        }
      }, 3500);
      return () => clearTimeout(scrollTimer);
    }
  }, [isVideoFinished]);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="bg-[#232020] min-h-screen text-zinc-300 font-sans selection:bg-[#974B60]/50 relative overflow-hidden">

      {/* Sticky Navigation Tab - Neo-brutalist style */}
      <motion.div
        style={{
          opacity: scrollYProgress,
          y: useTransform(scrollYProgress, [0, 0.1], [-80, 0]),
          pointerEvents: useTransform(scrollYProgress, (v) => v > 0.05 ? "auto" : "none")
        }}
        className="fixed top-0 inset-x-0 z-50 bg-[#232020] border-b-[4px] border-black shadow-[0_4px_0_#000] py-3 md:py-4 px-4 md:px-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <img src={nitmunxivLogo} alt="NITMUN Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
            <span className="text-xl md:text-2xl font-staatliches tracking-wide text-white translate-y-[2px]">NITMUN <span className="text-[#e08585]">XIV</span></span>
          </div>
          <div className="flex items-center gap-3 md:gap-6 font-antonio tracking-widest uppercase">
            <button
              onClick={() => setShowStudyGuides(true)}
              title="Study Guides"
              className="flex items-center justify-center text-sm md:text-base text-zinc-300 hover:text-white hover:underline decoration-2 underline-offset-4 transition-all"
            >
              <BookOpen className="w-5 h-5 md:hidden" />
              <span className="hidden md:inline">Study Guides</span>
            </button>
            <button
              onClick={() => setShowGallery(true)}
              title="Gallery"
              className="flex items-center justify-center text-sm md:text-base text-zinc-300 hover:text-white hover:underline decoration-2 underline-offset-4 transition-all"
            >
              <ImageIcon className="w-5 h-5 md:hidden" />
              <span className="hidden md:inline">Gallery</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="px-4 py-2 bg-[#974B60] text-white border-[2px] border-black rounded shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-[#c58715] transition-all"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <div className="relative w-full h-screen h-[100dvh] overflow-hidden flex flex-col items-center justify-end pb-32 md:pb-12 border-b-[8px] border-black shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20 bg-[#111]">
        <motion.div style={{ opacity: videoOpacity }} className="absolute inset-0 z-0">
          <video
            src={nitmunxivvideo}
            autoPlay
            muted
            playsInline
            onEnded={() => setIsVideoFinished(true)}
            id="mobile-bg-video"
            className="absolute inset-0 w-full h-full object-cover md:hidden opacity-80"
          />
          <video
            src={nitmunxivDesktopVideo}
            autoPlay
            muted
            playsInline
            onEnded={() => setIsVideoFinished(true)}
            id="desktop-bg-video"
            className="absolute inset-0 w-full h-full object-cover hidden md:block opacity-80"
          />
          {/* Grain overlay */}
          <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </motion.div>

        {/* Hero Content Overlay */}
        <AnimatePresence>
          {isVideoFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative z-10 flex flex-col items-center justify-center w-full px-4 mb-8 md:mb-16 mix-blend-screen"
            >
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-[20vw] md:text-[15vw] leading-[0.85] font-antonio font-bold text-[#e08585] tracking-tighter text-center uppercase drop-shadow-[0_0_15px_rgba(224,133,133,0.5)]"
              >
                NITMUN<span className="text-[#bb943a]">XIV</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-4 md:mt-2 text-xl md:text-3xl font-mono text-zinc-300 tracking-tight"
              >
                <div className="relative inline-block bg-[#111] px-4 py-2 border-2 border-[#e08585]">
                  <motion.span
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "linear", delay: 1 }}
                    className="inline-block overflow-hidden whitespace-nowrap"
                  >
                    A Forum for the Formidable
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="absolute -right-[4px] top-[10%] h-[80%] w-[10px] bg-[#bb943a] inline-block"
                  />
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 1 }}
                className="mt-6 md:mt-8 flex items-center gap-2 text-sm md:text-base font-antonio font-bold uppercase tracking-widest text-black bg-[#bb943a] px-6 py-2 border-[3px] border-black shadow-[4px_4px_0_#000]"
              >
                <span className="w-2 h-2 bg-black animate-pulse" />
                7th and 8th of March 2026
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Prompt */}
        <motion.button
          onClick={scrollToContent}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4, duration: 1 }}
          className="relative z-10 flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors group cursor-pointer mt-4"
        >
          <span className="text-sm font-bold font-antonio tracking-widest uppercase">Scroll Below</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown className="w-8 h-8 opacity-70 group-hover:opacity-100 group-hover:text-[#bb943a]" />
          </motion.div>
        </motion.button>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full pb-32 pt-24 md:pt-32 z-10">
        <MarqueeBackground />

        {/* --- Vertical Side Ambient Texts --- */}
        <div className="absolute left-6 top-[20%] text-[8vh] font-staatliches text-zinc-500/20 uppercase tracking-widest pointer-events-none hidden xl:block mix-blend-overlay selection-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          LITERARY CIRCLE
        </div>
        <div className="absolute right-6 top-[40%] text-[8vh] font-staatliches text-[#e08585]/20 uppercase tracking-widest pointer-events-none hidden xl:block mix-blend-overlay selection-none" style={{ writingMode: 'vertical-rl' }}>
          NITMUN XIV
        </div>
        <div className="absolute left-6 top-[70%] text-[8vh] font-staatliches text-[#bb943a]/20 uppercase tracking-widest pointer-events-none hidden xl:block mix-blend-overlay selection-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          INTERNATIONAL PRESS
        </div>
        {/* --- End Ambient Texts --- */}

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 space-y-20 md:space-y-32">

          {/* About TLC */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-[#232020]/80 backdrop-blur-md rounded-[20px] border-[5px] border-black shadow-[8px_10px_0_#000] p-6 md:p-10 relative group hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[12px_14px_0_#bb943a] transition-all duration-300"
          >
            {/* Watermark Logo */}
            <img
              src="http://www.lcnitd.co.in/images/tlclogo.png"
              alt=""
              className="absolute inset-0 m-auto w-[60%] md:w-[40%] opacity-[0.05] pointer-events-none mix-blend-screen filter grayscale-[100%]"
            />

            <div className="absolute top-0 right-0 py-2 px-4 bg-black text-white font-antonio font-bold text-lg transform rotate-[-5deg] translate-x-4 -translate-y-4 shadow-[4px_4px_0_#bb943a] z-10">
              ORGANIZERS
            </div>
            <h2 className="text-5xl md:text-7xl font-staatliches text-[#bb943a] uppercase tracking-wide mb-6 drop-shadow-[2px_2px_0_#000] relative z-10">
              About Literary Circle
            </h2>
            <div className="text-base md:text-xl text-zinc-300 font-mono leading-relaxed relative group prose prose-invert max-w-none z-10">
              {isLoadingContent ? (
                <p className="animate-pulse">Loading content...</p>
              ) : (
                <EditableText
                  value={aboutTlcText}
                  onSave={handleSaveTlcText}
                  canEdit={Boolean(isAdmin)}
                  className="font-mono bg-black/20 p-4 rounded border-2 border-transparent hover:border-[#bb943a]/50 transition-colors"
                  showLastEdited={Boolean(isAdmin)}
                  lastEditedBy={lastEditedTlcBy}
                />
              )}
              {isAdmin && !isLoadingContent && (
                <p className="text-xs text-[#bb943a] mt-4 font-sans font-bold uppercase tracking-wider block border-l-4 border-[#bb943a] pl-3 py-1 bg-black/40">
                  Admin: Hover over text to edit
                </p>
              )}
            </div>
          </motion.section>

          {/* About NITMUN XIV */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-[#232020]/80 backdrop-blur-md rounded-[20px] border-[5px] border-black shadow-[8px_10px_0_#000] p-6 md:p-10 relative group hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[12px_14px_0_#e08585] transition-all duration-300"
          >
            {/* Watermark Logo */}
            <img
              src={nitmunxivLogo}
              alt=""
              className="absolute inset-0 m-auto w-[60%] md:w-[40%] opacity-[0.05] pointer-events-none mix-blend-screen"
            />

            <div className="absolute top-0 right-0 py-2 px-4 bg-black text-white font-antonio font-bold text-lg transform rotate-[3deg] translate-x-2 -translate-y-4 shadow-[4px_4px_0_#e08585] z-10">
              THE FORUM
            </div>
            <h2 className="text-5xl md:text-7xl font-staatliches text-[#e08585] uppercase tracking-wide mb-6 drop-shadow-[2px_2px_0_#000] relative z-10">
              About NITMUN XIV
            </h2>
            <div className="text-base md:text-xl text-zinc-300 font-mono leading-relaxed relative group prose prose-invert max-w-none z-10">
              {isLoadingContent ? (
                <p className="animate-pulse">Loading content...</p>
              ) : (
                <EditableText
                  value={aboutNitmunText}
                  onSave={handleSaveNitmunText}
                  canEdit={Boolean(isAdmin)}
                  className="font-mono bg-black/20 p-4 rounded border-2 border-transparent hover:border-[#e08585]/50 transition-colors text-lg md:text-2xl text-zinc-200 backdrop-blur-sm"
                  showLastEdited={Boolean(isAdmin)}
                  lastEditedBy={lastEditedNitmunBy}
                />
              )}
            </div>
          </motion.section>

          {/* Countdown Timer */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-[#c58715] rounded-[20px] border-[5px] border-black shadow-[8px_10px_0_#000] p-8 md:p-12 text-center overflow-hidden relative group hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[12px_14px_0_#000] transition-all duration-300"
          >
            {/* Brutalist Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>

            {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 ? (
              <div className="relative z-10 py-8">
                <h3 className="text-6xl md:text-8xl font-staatliches text-black uppercase tracking-widest mb-4 drop-shadow-[4px_4px_0_#fff]">
                  NITMUN XIV is over
                </h3>
                <p className="text-xl md:text-3xl font-antonio font-bold text-white bg-black inline-block px-6 py-2 shadow-[4px_4px_0_#fff] -rotate-2">
                  See you at NITMUN XV next year
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl md:text-4xl font-staatliches text-black uppercase mb-8 relative z-10 drop-shadow-[1px_1px_0_#fff]">
                  Commencing In
                </h3>

                <div className="flex flex-wrap justify-center gap-4 md:gap-8 relative z-10">
                  {[
                    { label: 'Days', value: timeLeft.days },
                    { label: 'Hours', value: timeLeft.hours },
                    { label: 'Minutes', value: timeLeft.minutes },
                    { label: 'Seconds', value: timeLeft.seconds }
                  ].map((unit) => (
                    <div key={unit.label} className="flex flex-col items-center">
                      <div className="w-20 h-24 md:w-32 md:h-36 bg-white border-[4px] border-black shadow-[4px_6px_0_#000] flex items-center justify-center rounded-xl relative overflow-hidden group">
                        <span className="text-5xl md:text-7xl font-antonio font-bold text-black tracking-tighter">
                          {unit.value.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-base md:text-xl text-black font-antonio font-bold uppercase tracking-widest mt-4">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.section>

          {/* Grouped Bottom Sections */}
          <div className="space-y-8 md:space-y-12 w-full mx-auto" ref={actionButtonsRef}>

            {/* Action Buttons */}
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
            >
              <div className={isAdmin ? "grid grid-cols-1 md:grid-cols-3 gap-6 w-full" : "grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto"}>

                {/* Study Guides Button */}
                <button
                  onClick={() => setShowStudyGuides(true)}
                  className="relative block w-full bg-[#974B60] text-white rounded-xl border-[4px] border-black shadow-[6px_8px_0_#000] overflow-hidden group active:translate-y-2 active:translate-x-2 active:shadow-none transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[10px_12px_0_#000]"
                >
                  <div className="absolute inset-0 bg-[#c58715] top-[110%] group-hover:top-0 transition-all duration-300 z-0"></div>
                  <div className="relative z-10 p-6 md:p-8 flex flex-col items-start gap-2 h-full">
                    <BookOpen className="w-8 h-8 mb-2" />
                    <span className="text-3xl font-staatliches tracking-wide uppercase">Study Guides</span>
                    <span className="text-sm font-mono text-zinc-100/90 leading-tight">Access comprehensive committee materials</span>
                  </div>
                </button>

                {/* Photo Gallery Button */}
                <button
                  onClick={() => setShowGallery(true)}
                  className="relative block w-full bg-[#974B60] text-white rounded-xl border-[4px] border-black shadow-[6px_8px_0_#000] overflow-hidden group active:translate-y-2 active:translate-x-2 active:shadow-none transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[10px_12px_0_#000]"
                >
                  <div className="absolute inset-0 bg-[#c58715] top-[110%] group-hover:top-0 transition-all duration-300 z-0"></div>
                  <div className="relative z-10 p-6 md:p-8 flex flex-col items-start gap-2 h-full">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-3xl font-staatliches tracking-wide uppercase">Photo Gallery</span>
                    <span className="text-sm font-mono text-zinc-100/90 leading-tight">Relive past moments of diplomacy</span>
                  </div>
                </button>

                {/* Admin Button */}
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="relative block w-full bg-[#e08585] text-black rounded-xl border-[4px] border-black shadow-[6px_8px_0_#000] overflow-hidden group active:translate-y-2 active:translate-x-2 active:shadow-none transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[10px_12px_0_#000]"
                  >
                    <div className="absolute inset-0 bg-[#bb943a] top-[110%] group-hover:top-0 transition-all duration-300 z-0 text-black"></div>
                    <div className="relative z-10 p-6 md:p-8 flex flex-col items-start gap-2 h-full">
                      <Shield className="w-8 h-8 mb-2" />
                      <span className="text-3xl font-staatliches tracking-wide uppercase">Registrations</span>
                      <span className="text-sm font-mono text-black/80 font-bold leading-tight">Manage and review delegates</span>
                    </div>
                  </button>
                )}

              </div>
            </motion.section>

            {/* New to MUN Video Link */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <a
                href="https://www.youtube.com/watch?v=9EhrOk2mWXI"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-[20px] border-[5px] border-black bg-white shadow-[8px_10px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_5px_0_#000] active:translate-x-3 active:translate-y-3 active:shadow-none transition-all cursor-pointer relative"
              >
                <div className="flex flex-col md:flex-row items-center gap-6 flex-1 text-center md:text-left">
                  <div className="w-20 h-20 shrink-0 rounded-full border-[4px] border-black bg-[#e08585] flex items-center justify-center text-black group-hover:bg-[#c58715] transition-colors shadow-[4px_4px_0_#000]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-3xl md:text-4xl font-staatliches text-black uppercase tracking-wide">
                      New to MUN?
                    </h4>
                    <p className="text-sm md:text-lg text-black/70 font-mono font-bold">
                      Click Here to watch a quick guide on the rules!
                    </p>
                  </div>
                </div>
              </a>
            </motion.section>

            {/* AI Assistant Banner (Visible to all) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="pt-4"
            >
              <div
                onClick={() => {
                  if (isInhouseUser) {
                    setShowAIAssistant(true);
                  } else {
                    setShowBotIntruderAlert(true);
                  }
                }}
                className="group flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-[20px] border-[5px] border-black bg-white shadow-[8px_10px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_5px_0_#000] active:translate-x-3 active:translate-y-3 active:shadow-none transition-all cursor-pointer relative"
              >
                <div className="flex flex-col md:flex-row items-center gap-6 flex-1 text-center md:text-left">
                  <div className="space-y-1">
                    <h4 className="text-3xl md:text-4xl font-staatliches text-black uppercase tracking-wide">
                      Confused about which committee to choose?
                    </h4>
                    <p className="text-sm md:text-lg text-black/70 font-mono font-bold">
                      NITMUN AI is here to guide you to the best committee
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 text-xl font-staatliches uppercase tracking-wider text-[#974B60] group-hover:text-[#c58715] transition-colors shrink-0">
                  Ask NITMUN AI <span className="transform group-hover:translate-x-2 transition-transform text-2xl font-sans inline-block ml-2">→</span>
                </div>
              </div>
            </motion.section>

          </div>

        </div>
      </div>

      {/* Modals */}
      {!isAdmin && (
        <NitmunRegistrationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setPreselectedCommittee('');
          }}
          initialCommittee={preselectedCommittee}
        />
      )}

      {isAdmin && showAdminPanel && (
        <NitmunAdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      <StudyGuidesModal
        isOpen={showStudyGuides}
        onClose={() => setShowStudyGuides(false)}
      />

      <PhotoGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
      />

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIAssistant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-gradient-to-br from-[#2a2a2a] via-[#232020] to-[#1a1a1a] rounded-none md:rounded-[20px] shadow-none md:shadow-[8px_10px_0_#000] border-0 md:border-[5px] md:border-black overflow-hidden h-[100dvh] md:h-[80vh] flex flex-col pt-2 md:pt-8 pb-0 md:pb-4 px-0 md:px-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-2 bg-gradient-to-r from-[#bb943a] via-[#e08585] to-[#c58715] absolute top-0 inset-x-0" />
              <button onClick={() => setShowAIAssistant(false)}
                className="absolute top-4 right-4 z-[110] w-8 h-8 flex items-center justify-center bg-black hover:bg-zinc-800 border-2 border-[#e08585] text-[#e08585] font-bold transition-all duration-200 shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                aria-label="Close modal">
                <span className="text-sm">X</span>
              </button>
              <CommitteeAIAssistant
                onBack={() => setShowAIAssistant(false)}
                onSelectCommittee={(committee) => {
                  setPreselectedCommittee(committee);
                  setShowAIAssistant(false);
                  setShowModal(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bot Intruder Alert Modal */}
      <AnimatePresence>
        {showBotIntruderAlert && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-black border-[6px] border-[#e08585] shadow-[10px_10px_0_#974B60] overflow-hidden p-2"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-[3px] border-dashed border-[#e08585] p-8 text-center relative h-full">
                <button onClick={() => setShowBotIntruderAlert(false)}
                  className="absolute top-4 right-4 p-2 bg-black text-[#e08585] hover:text-white hover:bg-[#e08585] border-2 border-[#e08585] transition-colors duration-200"
                  aria-label="Close">
                  <span className="stroke-[3] font-bold">X</span>
                </button>

                <div className="text-7xl mb-6 filter drop-shadow-[4px_4px_0_#e08585]">⚠️</div>
                <h2 className="text-4xl md:text-5xl font-staatliches uppercase tracking-wide text-[#e08585] mb-4">Unauthorised Access</h2>

                <div className="bg-[#e08585]/10 p-4 border-l-[4px] border-[#e08585] mb-6 inline-block text-left">
                  <p className="text-zinc-200 font-mono font-bold leading-relaxed mb-2 text-sm">
                    {">"} ERROR: Unauthorized Access Detected.
                  </p>
                  <p className="text-white font-mono text-xs">
                    This feature is exclusively for NIT Durgapur students.
                  </p>
                </div>

                <p className="text-gray-400 font-antonio text-lg tracking-wide uppercase">
                  If you are one, please
                  <strong className="text-white border-b-2 border-[#e08585] ml-2">sign in</strong> with your NIT Durgapur email ID.
                </p>

                <button
                  onClick={() => {
                    setShowBotIntruderAlert(false);
                    setShowModal(true);
                  }}
                  className="mt-8 px-8 py-3 bg-[#e08585] text-black font-staatliches text-2xl uppercase tracking-widest border-[4px] border-black shadow-[4px_4px_0_#bb943a] hover:bg-[#ec9696] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-y-2 active:translate-x-2 transition-all w-full"
                >
                  Proceed to Login / Sign Up
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}