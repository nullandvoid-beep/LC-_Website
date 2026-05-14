import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// Dynamically import all webp images from the gallery folder
const imageRecords = import.meta.glob('../../assets/nitmunxiv/gallery/*.webp', { eager: true, query: '?url', import: 'default' });
const images = Object.values(imageRecords) as string[];

// Distribute images
const carouselImages = images.slice(0, 7);
const bentoImages = images.slice(7);

export function Gallery() {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const smoothScroll = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <section ref={containerRef} id="gallery" className="relative w-full bg-verve-dark border-y-[8px] border-black text-white pt-24 pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0" />

            <div className="max-w-7xl mx-auto px-4 md:px-8 mb-20 relative z-10 text-center">
                <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-heading font-black uppercase text-verve-gold tracking-tighter mb-4 leading-none select-none drop-shadow-[0_0_15px_rgba(252,194,1,0.3)]">
                    The Archive
                </h2>
                <p className="font-mono text-sm md:text-base text-white/60 max-w-xl mx-auto uppercase tracking-widest leading-relaxed">
                    A curated collection of unfiltered expression, captured moments, and relentless passion.
                </p>
            </div>

            {/* 3D Arc Carousel Section */}
            <ArcCarousel images={carouselImages} scrollProgress={smoothScroll} />

            {/* Space between sections */}
            <div className="h-24 md:h-32" />

            {/* Bento Grid layout */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">

                <div className="mb-16 md:mb-24 mt-12 md:mt-16 text-center max-w-3xl mx-auto">
                    <h3 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold uppercase text-white mb-6 leading-tight">
                        Everything You <span className="text-verve-pink italic">Need to Witness</span>
                    </h3>
                    <p className="font-mono text-white/50 text-sm md:text-base leading-relaxed">
                        From raw debates to ecstatic performances, our visual memory spans across every facet of the festival. Dive into the archive below.
                    </p>
                </div>

                <BentoGrid images={bentoImages} />
            </div>

        </section>
    );
}

function ArcCarousel({ images, scrollProgress }: { images: string[], scrollProgress: any }) {
    // We want the entire carousel to slightly rotate based on scroll
    // This gives the impression of panning across the 3D cylinder
    const rotateY = useTransform(scrollProgress, [0, 1], [40, -40]);
    // Different radius on mobile vs desktop to fit on screen
    const radius = window.innerWidth < 768 ? 600 : 1200;

    return (
        <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden [perspective:1000px] md:[perspective:2000px] z-20 mt-6 md:mt-10">
            {/* Gradient fade on edges to mask the cylinder sides */}
            <div className="absolute inset-y-0 left-0 w-16 md:w-64 bg-gradient-to-r from-verve-dark to-transparent z-30 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 md:w-64 bg-gradient-to-l from-verve-dark to-transparent z-30 pointer-events-none" />

            <motion.div
                style={{ rotateY, z: -radius }}
                className="flex items-center justify-center w-full h-full [transform-style:preserve-3d]"
            >
                {images.map((img, index) => {
                    const totalItems = images.length;
                    // Spread items across 120 degrees 
                    const angleStep = 120 / (totalItems - 1);
                    const angle = -60 + (index * angleStep);
                    const isCenter = index === Math.floor(totalItems / 2);

                    return (
                        <div
                            key={index}
                            className={`absolute w-[60vw] md:w-[28vw] max-w-[400px] h-[50vh] md:h-[60vh] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-700 hover:scale-[1.03] cursor-pointer bg-verve-light/5 backdrop-blur-md ${isCenter ? 'border-4 border-verve-gold shadow-[0_0_80px_rgba(252,194,1,0.3)]' : 'border border-white/10'}`}
                            style={{
                                transform: `rotateY(${angle}deg) translateZ(${radius}px)`
                            }}
                        >
                            <img src={img} alt={`Carousel ${index}`} className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110 opacity-60 hover:opacity-100 mix-blend-luminosity hover:mix-blend-normal" />
                            {/* Inner glow/shadow */}
                            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] pointer-events-none transition-opacity duration-500 hover:opacity-0" />
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}

function BentoGrid({ images }: { images: string[] }) {
    // Array specifying the grid span classes to simulate the beautiful Flowblox asymmetric look.
    const layoutPattern = [
        "col-span-12 md:col-span-8 row-span-2", // Massive hero image
        "col-span-6 md:col-span-4 row-span-1",  // Top right square
        "col-span-6 md:col-span-4 row-span-1",  // Middle right square
        "col-span-12 md:col-span-4 row-span-2", // Tall portrait left
        "col-span-12 md:col-span-8 row-span-1", // Wide center
        "col-span-6 md:col-span-4 row-span-1",  // Small square right
        "col-span-6 md:col-span-4 row-span-1",  // Small square left
        "col-span-12 md:col-span-4 row-span-2", // Tall portrait 
        "col-span-12 md:col-span-6 row-span-1", // Horizontal
        "col-span-12 md:col-span-6 row-span-1", // Horizontal
        "col-span-12 md:col-span-8 row-span-2", // Massive hero reversed
        "col-span-6 md:col-span-4 row-span-1",  // Square
        "col-span-6 md:col-span-4 row-span-1",  // Square
        "col-span-12 row-span-1"                // Full width footer
    ];

    // Titles for hover effects
    const hoverTitles = [
        "Unleashing Energy", "Focus & Precision", "The Debates", "Raw Moments",
        "Stage Performances", "Backstage Chaos", "Late Night Grinds", "The Verdict",
        "Closing Ceremonies", "Speaker Sessions", "Audience Reactions", "The Setup",
        "Final Goodbyes", "The Legacy"
    ];

    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8 auto-rows-[250px] md:auto-rows-[350px]">
            {images.map((img, index) => {
                const spanClass = layoutPattern[index % layoutPattern.length];
                const title = hoverTitles[index % hoverTitles.length];

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "100px" }}
                        transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }} // smooth ease out
                        className={`${spanClass} rounded-[2rem] lg:rounded-[3rem] overflow-hidden relative group cursor-pointer border-2 border-white/5 bg-white/5 shadow-2xl origin-center`}
                    >
                        <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 group-hover:-rotate-1 opacity-70 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal" />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-verve-dark/95 via-verve-dark/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-10">
                            <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                <div className="w-12 h-1 bg-verve-pink mb-4 shadow-[0_0_10px_#e08585]" />
                                <h3 className="text-white font-heading text-3xl md:text-5xl uppercase tracking-wider leading-none">
                                    {title}
                                </h3>
                                <p className="text-white/70 font-mono text-xs md:text-sm mt-3 uppercase tracking-widest shrink-0">
                                    Archive // Phase 0{index + 1}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
