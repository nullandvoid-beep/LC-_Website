import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import img1 from '../../assets/nitmunxiv/gallery/WhatsApp Image 2026-03-05 at 02.08.37.webp';
import img2 from '../../assets/nitmunxiv/gallery/WhatsApp Image 2026-03-05 at 02.08.49.webp';
import img3 from '../../assets/nitmunxiv/gallery/WhatsApp Image 2026-03-05 at 02.08.57.webp';

export interface TeamGroup {
    id: number;
    name: string;
    role: string;
    image: string;
    color: string;
    description: string;
}

const TEAM_YEARS: TeamGroup[] = [
    {
        id: 4,
        name: "4th Year",
        role: "The Architects",
        image: img1,
        color: "#fcc201",
        description: "The seniors who built the foundation and guided the chaos into creation."
    },
    {
        id: 3,
        name: "3rd Year",
        role: "The Executives",
        image: img2,
        color: "#e08585",
        description: "The driving force executing the vision across every dimension of the festival."
    },
    {
        id: 2,
        name: "2nd Year",
        role: "The Vanguard",
        image: img3,
        color: "#974B60",
        description: "The tireless organizers ensuring every detail is ruthlessly perfected."
    }
];

// Reusable Stacked Card Component
const StackCard = ({
    group,
    i,
    progress,
    range,
    targetScale
}: {
    group: TeamGroup,
    i: number,
    progress: MotionValue<number>,
    range: number[],
    targetScale: number
}) => {

    // Scale down this card when the next one begins entering
    const scale = useTransform(progress, range, [1, targetScale]);
    // Push this card upwards slightly to create stacking depth
    const yOffset = useTransform(progress, range, ["0%", `-${(TEAM_YEARS.length - 1 - i) * 2}%`]);
    // Dim the background image as cards stack on top
    const brightness = useTransform(progress, range, [1, 1 - (TEAM_YEARS.length - 1 - i) * 0.2]);

    return (
        <div className="h-screen w-full flex items-center justify-center sticky top-0">
            <motion.div
                style={{ scale, y: yOffset }}
                className="w-full h-[85vh] lg:h-[80vh] max-w-7xl mx-4 md:mx-8 bg-verve-dark rounded-[2rem] md:rounded-[3rem] overflow-hidden relative shadow-2xl shadow-black/50 flex flex-col justify-end origin-top"
            >
                {/* Massive Parallax Background Image */}
                <motion.div
                    className="absolute inset-0 w-full h-full bg-cover bg-center origin-center"
                    style={{
                        backgroundImage: `url(${group.image})`,
                        filter: `brightness(${brightness}) grayscale(30%)`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                {/* Content Overlay */}
                <div className="relative z-20 p-6 md:p-12 w-full flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="flex flex-col">
                        <div className="inline-block px-4 py-2 rounded-full border mb-4 w-fit bg-black/40 backdrop-blur-md" style={{ borderColor: group.color, color: group.color }}>
                            <span className="font-mono font-bold tracking-wider text-sm md:text-base uppercase">{group.role}</span>
                        </div>
                        <h3
                            className="text-7xl md:text-[8rem] lg:text-[10rem] font-sans font-black uppercase text-white leading-[0.85] tracking-tighter"
                            style={{ WebkitTextStroke: `1px ${group.color}` }}
                        >
                            {group.name.split(' ')[0]}<br />
                            <span className="text-4xl md:text-6xl lg:text-7xl" style={{ color: group.color, WebkitTextStroke: '0px' }}>{group.name.split(' ')[1]}</span>
                        </h3>
                    </div>

                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 max-w-sm md:mb-4">
                        <p className="font-mono text-white/80 text-sm md:text-base leading-relaxed">
                            {group.description}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export function Team() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Fade out the massive title precisely across the initial spacer
    const titleOpacity = useTransform(scrollYProgress, [0, 0.20], [1, 0]);

    return (
        <section id="team" ref={containerRef} className="relative w-full h-[400vh] bg-verve-dark border-b-[8px] border-black">

            {/* Massive Underlay Title */}
            <motion.div
                style={{ opacity: titleOpacity }}
                className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden pointer-events-none z-0"
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <h2 className="text-[15rem] md:text-[25rem] font-heading font-black uppercase leading-none text-white/5 opacity-50 absolute mix-blend-overlay select-none">
                    COVEN
                </h2>
                <div className="absolute top-28 md:top-32 left-1/2 -translate-x-1/2 z-10 text-center w-full px-4">
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold uppercase text-white tracking-widest">
                        The Core Team
                    </h2>
                    <p className="mt-2 md:mt-4 font-mono text-white/50 uppercase tracking-widest text-xs md:text-sm">
                        Scroll to witness the hierarchy
                    </p>
                </div>
            </motion.div>

            {/* Stacking Cards Container */}
            <div className="absolute top-0 left-0 w-full h-full z-10 pt-[100vh]">
                {TEAM_YEARS.map((group, i) => {
                    const targetScale = 1 - ((TEAM_YEARS.length - 1 - i) * 0.05);
                    return (
                        <StackCard
                            key={group.id}
                            i={i}
                            {...{ group, progress: scrollYProgress, range: [(i + 1) * 0.20, 1], targetScale }}
                        />
                    );
                })}
            </div>

        </section>
    );
}
