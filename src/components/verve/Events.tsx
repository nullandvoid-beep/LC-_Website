import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export interface EventData {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    color: string;
    poster?: string;
}

export const EVENTS_DATA: EventData[] = [
    {
        id: "vocab",
        title: "Vocab",
        description: "A battle of vocabulary and wit! Prove your linguistic dominance in this intense vocabulary challenge.",
        date: "16th March",
        time: "TBD",
        venue: "SAC",
        color: "#e08585",
    },
    {
        id: "literati",
        title: "Literati",
        description: "Test your literary prowess. Dive into word games, literary quizzes, and trivia that will challenge the bibliophile in you.",
        date: "17th March",
        time: "TBD",
        venue: "Main Stage",
        color: "#fcc201",
    },
    {
        id: "wild-card",
        title: "Wild Card",
        description: "Expect the unexpected! A surprise event that will test your creativity, wit, and spontaneity.",
        date: "17th March",
        time: "TBD",
        venue: "TBD",
        color: "#ff3e3e",
    },
    {
        id: "treasure-hunt",
        title: "Treasure Hunt",
        description: "The most anticipated event of the fest! Solve cryptic clues and race across the campus to unearth the hidden treasure.",
        date: "18th March",
        time: "TBD",
        venue: "Oval Stands",
        color: "#c084fc",
    },
    {
        id: "public-speaking",
        title: "Public Speaking",
        description: "Step up to the podium and captivate the crowd! Showcase your oratory skills in this electrifying public speaking contest.",
        date: "18th March",
        time: "TBD",
        venue: "TBD",
        color: "#1dfa82",
    },
    {
        id: "open-mic",
        title: "Open Mic",
        description: "The stage is yours! Poetry, storytelling, stand-up, or anything in between — grab the mic and let your voice be heard.",
        date: "18th March",
        time: "TBD",
        venue: "TBD",
        color: "#38bdf8",
    }
];

interface EventsProps {
    onRegisterClick?: (eventId: string) => void;
}

export function Events({ onRegisterClick }: EventsProps) {
    const targetRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    const smoothScrollYProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const x = useTransform(smoothScrollYProgress, [0, 1], ["0%", "-100%"]);

    // Background parallax & marquees
    const marqueeX1 = useTransform(smoothScrollYProgress, [0, 1], ["0%", "-30%"]);
    const marqueeX2 = useTransform(smoothScrollYProgress, [0, 1], ["-30%", "0%"]);

    const [activeDateIndex, setActiveDateIndex] = useState(0);
    const uniqueDates = Array.from(new Set(EVENTS_DATA.map(e => e.date))).sort();

    useEffect(() => {
        return smoothScrollYProgress.onChange((latest) => {
            const index = Math.min(
                uniqueDates.length - 1,
                Math.floor(latest * uniqueDates.length)
            );
            setActiveDateIndex(index);
        });
    }, [smoothScrollYProgress, uniqueDates]);

    const groupedData: { date: string, times: { time: string, events: EventData[] }[] }[] = [];
    uniqueDates.forEach(date => {
        const eventsForDate = EVENTS_DATA.filter(event => event.date === date);
        const timeBlocks: { time: string, events: EventData[] }[] = [];

        eventsForDate.forEach((event, index) => {
            if (event.time.toLowerCase() === 'tbd') {
                // Each TBD event gets its own time block
                timeBlocks.push({
                    time: `TBD-${index}`, // Unique key for rendering, we'll strip the -index later
                    events: [event]
                });
            } else {
                // Group non-TBD events by time
                let existingBlock = timeBlocks.find(b => b.time === event.time);
                if (existingBlock) {
                    existingBlock.events.push(event);
                } else {
                    timeBlocks.push({
                        time: event.time,
                        events: [event]
                    });
                }
            }
        });

        groupedData.push({
            date,
            times: timeBlocks
        });
    });

    return (
        <section ref={targetRef} id="events" className="relative w-full h-[350vh] bg-verve-dark border-y-[12px] border-black text-white z-10">
            <div className="sticky top-0 h-screen flex flex-col pt-[80px] md:pt-[100px] pb-8 overflow-hidden relative border-black">

                {/* CYBER-BRUTALIST BACKGROUND NOISE & GRID */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.05)_2px,transparent_2px)] bg-[size:100px_100px] z-0 pointer-events-none" />

                {/* MASSIVE BACKGROUND PARALLAX TEXT MARQUEES */}
                <div className="absolute inset-0 z-0 flex flex-col justify-center overflow-hidden opacity-20 pointer-events-none mix-blend-difference h-full">
                    <motion.div style={{ x: marqueeX1, WebkitTextStroke: '6px #fcc201' }} className="whitespace-nowrap text-[15rem] md:text-[25rem] font-heading font-black text-verve-gold uppercase tracking-tighter leading-none">
                        CHAOS EVENTS MADNESS INSANITY CHAOS EVENTS MADNESS INSANITY
                    </motion.div>
                    <motion.div style={{ x: marqueeX2, WebkitTextStroke: '4px #e08585' }} className="whitespace-nowrap text-[15rem] md:text-[25rem] font-heading font-black text-transparent uppercase tracking-tighter leading-none -mt-16">
                        VERVE XXI VERVE XXI VERVE XXI VERVE XXI VERVE XXI
                    </motion.div>
                </div>

                {/* HEADERS & NAVIGATION */}
                <div className="relative z-20 px-4 md:px-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pointer-events-none mt-2">
                    <h2 className="text-6xl md:text-9xl font-heading font-black text-white uppercase tracking-tighter mix-blend-difference drop-shadow-[8px_8px_0_#fcc201] pointer-events-auto leading-none">
                        EVENTS
                    </h2>

                    <div className="flex gap-4 md:gap-8 pb-4 pointer-events-auto">
                        {uniqueDates.map((date, index) => {
                            const isActive = index === activeDateIndex;
                            return (
                                <div key={date} className={`flex flex-col items-start transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-100'}`}>
                                    <span className="text-3xl md:text-5xl font-heading font-black uppercase text-white tracking-tighter">
                                        D.{index + 1}
                                    </span>
                                    <span className={`font-mono font-bold text-sm px-2 py-0.5 mt-1 border-[2px] border-black ${isActive ? 'bg-verve-gold text-black' : 'bg-transparent text-white'}`}>
                                        {date}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* HORIZONTAL SCROLL TRACK */}
                <div className="flex-1 w-full relative mt-[2vh] md:mt-[4vh]">
                    <motion.div style={{ x }} className="absolute top-0 left-0 h-full flex items-center gap-16 md:gap-32 px-8 md:px-24 pr-[30vw] w-max z-20 pointer-events-auto">
                        {groupedData.map((dayGroup, dayIdx) => (
                            <div key={dayGroup.date} className="flex gap-16 md:gap-24 items-center h-[65vh] shrink-0 pb-8">

                                <div className="hidden md:flex flex-col shrink-0 mx-16 lg:mx-24 opacity-80 mix-blend-screen pointer-events-none relative w-16 items-center justify-center">
                                    <span className="text-[10rem] lg:text-[12rem] font-heading font-black text-transparent leading-[0.8] -rotate-90 whitespace-nowrap" style={{ WebkitTextStroke: '3px white' }}>
                                        DAY {dayIdx + 1}
                                    </span>
                                </div>

                                {dayGroup.times.map((timeBlock) => (
                                    <div key={`${dayGroup.date}-${timeBlock.time}`} className="flex gap-8 md:gap-16 items-center shrink-0 h-full">

                                        {/* BRUTALIST TIME STAMP */}
                                        <div className="flex flex-col items-center justify-center bg-white text-black p-4 border-[4px] border-black shadow-[8px_8px_0_#e08585] shrink-0 rotate-[-4deg] hover:rotate-0 transition-transform duration-300 pointer-events-auto min-w-[120px] min-h-[120px]">
                                            {timeBlock.time.toLowerCase().startsWith('tbd') ? (
                                                <span className="text-5xl md:text-7xl font-sans font-black tracking-tighter leading-none">
                                                    TBD
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-4xl md:text-7xl font-sans font-black tracking-tighter leading-none">
                                                        {timeBlock.time.split(' ')[0]}
                                                    </span>
                                                    <span className="text-xl md:text-3xl font-mono font-bold uppercase mt-1">
                                                        {timeBlock.time.split(' ')[1] || '---'}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* EVENT CARDS */}
                                        <div className="flex gap-8 md:gap-16 shrink-0 items-center h-full">
                                            {timeBlock.events.map((event, eventIdx) => (
                                                <div key={event.id} className="w-[85vw] md:w-[60vw] lg:w-[45vw] lg:max-w-[600px] shrink-0 h-[60vh] min-h-[400px] max-h-[500px]">
                                                    <EventCard event={event} index={eventIdx} onRegister={() => onRegisterClick?.(event.id)} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20"
                >
                    <span className="text-white/50 font-mono text-xs uppercase tracking-widest font-bold">Scroll Down</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down text-verve-gold animate-bounce"><path d="m6 9 6 6 6-6" /></svg>
                </motion.div>
            </div>
        </section>
    );
}

interface EventCardProps {
    event: EventData;
    index: number;
    onRegister: () => void;
}

function EventCard({ event, index, onRegister }: EventCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: index % 2 === 0 ? 3 : 2 }}
            viewport={{ once: true, margin: "100px" }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="w-full h-full relative group perspective-1000"
        >
            <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 md:translate-x-6 md:translate-y-6 transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0 z-0" />
            <div className={`absolute inset-0 translate-x-5 translate-y-5 md:translate-x-10 md:translate-y-10 transition-transform duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 z-0`} style={{ backgroundColor: event.color, mixBlendMode: 'screen' }} />

            {/* MAIN CARD BODY */}
            <div className={`absolute inset-0 bg-verve-dark border-[4px] md:border-[8px] border-white flex flex-col overflow-hidden transition-all duration-300 z-10 p-6 md:p-8 hover:border-black`} style={{ backgroundColor: isHovered ? event.color : '#1a1a2e' }}>

                {/* Background Noise & Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50 mix-blend-overlay pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-40 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" style={{ backgroundColor: event.color }} />

                {/* Tags Banner */}
                <div className="flex justify-between items-start z-10 pointer-events-none relative">
                    <div className={`text-black px-4 py-1.5 font-mono font-bold uppercase border-[3px] border-black text-sm md:text-xl -rotate-2 hover:rotate-3 transition-colors ${isHovered ? 'bg-white' : 'bg-white'}`}>
                        {event.venue}
                    </div>
                </div>

                {/* Title & Poster Space Wrapper */}
                <div className="flex w-full mt-4 h-32 md:h-48 gap-4 items-stretch">
                    {/* Title Area */}
                    <div className="flex-1 flex flex-col justify-end pb-2">
                        <h3 className={`text-4xl md:text-5xl lg:text-6xl font-heading font-black uppercase tracking-tighter leading-[0.85] ${isHovered ? 'text-black' : 'text-white'}`} style={{ textShadow: isHovered ? 'none' : `4px 4px 0px ${event.color}` }}>
                            {event.title}
                        </h3>
                    </div>

                    {/* Poster Space */}
                    <div className={`w-1/2 h-full border-[2px] border-black overflow-hidden flex-shrink-0 relative transition-colors ${isHovered ? 'bg-black/10' : 'bg-white/5'}`}>
                        {event.poster ? (
                            <img src={event.poster} alt={`${event.title} poster`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                        ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50 mix-blend-overlay ${isHovered ? 'text-black' : 'text-white/50'}`}>
                                <span className="opacity-70">Poster Space</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-auto z-10 flex flex-col gap-4 pt-4">
                    <p className={`font-mono text-xs md:text-sm p-3 border-[2px] transition-colors ${isHovered ? 'bg-black/90 text-white border-black' : 'bg-black/50 text-white/90 border-white/20 backdrop-blur-md'}`}>
                        {event.description}
                    </p>

                    <button
                        onClick={onRegister}
                        className={`mt-1 md:mt-2 w-full font-heading font-black text-xl md:text-3xl uppercase py-2 md:py-3 border-[4px] border-black transition-all duration-300 ${isHovered ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                        style={{ boxShadow: isHovered ? `8px 8px 0px #000` : `8px 8px 0px ${event.color}` }}
                    >
                        REGISTER NOW
                    </button>
                </div>

                {/* Cyber-Brutalist decorative index */}
                <div className={`absolute bottom-4 right-4 font-mono font-black text-[10rem] leading-none pointer-events-none select-none mix-blend-overlay ${isHovered ? 'text-black opacity-40' : 'text-white/10 opacity-100'}`}>
                    0{index + 1}
                </div>
                {/* Neon Top Bar indicator */}
                {
                    !isHovered && (
                        <div className="absolute top-0 left-0 w-full h-[6px]" style={{ backgroundColor: event.color, boxShadow: `0 0 20px ${event.color}` }} />
                    )}
            </div>
        </motion.div>
    );
}
