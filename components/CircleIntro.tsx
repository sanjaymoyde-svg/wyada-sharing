
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { LOGO_URL, ELEMENT_ICONS } from '../constants';

interface CircleIntroProps {
    setLogoHidden: (hidden: boolean) => void;
}

export const CircleIntro: React.FC<CircleIntroProps> = ({ setLogoHidden }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
    const [imgError, setImgError] = useState(false);
    const lastHiddenState = useRef<boolean | null>(null);
    const [isProxyActive, setProxyActive] = useState(false);

    useEffect(() => {
        const updateVh = () => setVh(window.innerHeight);
        updateVh();
        window.addEventListener('resize', updateVh);
        return () => window.removeEventListener('resize', updateVh);
    }, []);

    // --- SCROLL LOGIC ---
    // Peak at 11.1vh (arrival from Future).
    const scrollStart = vh * 8.8;
    const scrollPeak = vh * 9.1;
    const scrollEnd = vh * 9.4;

    const scrollRange = [scrollStart, scrollPeak, scrollEnd];

    const top = useTransform(scrollY, scrollRange, [24, vh * 0.12, 24]);
    const scale = useTransform(scrollY, scrollRange, [1, 1.275, 1]);
    const opacity = useTransform(scrollY,
        [scrollStart - 50, scrollStart, scrollEnd, scrollEnd + 50],
        [0, 1, 1, 0]
    );

    useMotionValueEvent(scrollY, "change", (latest) => {
        const isActive = latest > (scrollStart - 100) && latest < (scrollEnd + 100);
        if (isActive !== isProxyActive) {
            setProxyActive(isActive);
        }

        const shouldHideNavbarLogo = latest >= scrollStart && latest <= scrollEnd;
        if (shouldHideNavbarLogo !== lastHiddenState.current) {
            lastHiddenState.current = shouldHideNavbarLogo;
            setLogoHidden(shouldHideNavbarLogo);
        }
    });

    return (
        <section
            id="section-circle"
            ref={containerRef}
            className="relative h-[200vh] w-full -mt-[100vh] snap-start snap-always z-[70]"
        >
            <div className="sticky top-0 h-[100dvh] w-full bg-[#9fc1c0] overflow-hidden shadow-[0_-50px_50px_rgba(0,0,0,0.2)] flex flex-col items-center justify-start">

                {createPortal(
                    isProxyActive && (
                        <motion.div
                            style={{
                                top,
                                scale,
                                opacity,
                                x: '-50%',
                                position: 'fixed',
                                left: '50%'
                            }}
                            className="z-[200] origin-top pointer-events-none flex items-center justify-center"
                        >
                            {!imgError ? (
                                <img
                                    src={LOGO_URL}
                                    alt="way'da"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        setImgError(true);
                                    }}
                                    draggable="false"
                                    referrerPolicy="no-referrer"
                                    className="h-12 md:h-14 w-auto object-contain select-none"
                                />
                            ) : (
                                <span className="text-4xl font-bold tracking-tighter text-white">way'da</span>
                            )}
                        </motion.div>
                    ),
                    document.body
                )}

                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 z-30 flex justify-center pointer-events-none">
                    <div className="text-xs font-bold tracking-[0.5em] text-white uppercase whitespace-nowrap mt-4">
                        Circle
                    </div>
                </div>

                <div className="w-full h-full relative z-10">
                    <div className="absolute top-0 left-0 w-full h-full px-8 md:px-16 pt-[38vh] md:pt-[35vh]">
                        {/* Text Container - Right padding on mobile to clear the circle */}
                        <div className="w-full text-left pointer-events-auto flex flex-col items-start pr-0 md:pr-[400px]">
                            <h2 className="text-4xl md:text-6xl font-bold text-white leading-none mb-2">community.</h2>
                            <h3 className="text-lg md:text-2xl font-medium italic text-white/80 leading-tight mb-8">where interests find their centre.</h3>
                            <p className="text-sm md:text-lg font-medium leading-relaxed text-white/90 max-w-lg mb-8">
                                Step into the <span className="font-bold">CIRCLE OF WORDS, PLAY, ART, and MUSIC.</span> A shared space to disconnect from the noise and connect through culture.
                            </p>
                            <p className="text-[10px] md:text-xs font-bold tracking-widest text-white/60 uppercase">
                                CURRENTLY ONLY IN INDORE, MADHYA PRADESH.
                            </p>
                        </div>

                        {/* Circle Interface - Mobile: Bottom Center. Desktop: Right Side Parallel to Heading. */}
                        <div className="absolute z-50 pointer-events-auto flex items-start
                                        top-[65vh] left-0 right-0 justify-center
                                        md:top-[25vh] md:right-[18vw] md:left-auto md:justify-center">
                            <div className="w-48 h-48 md:w-80 md:h-80 rounded-full border border-white/30 flex flex-col items-center justify-center gap-1 relative group cursor-pointer hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 rounded-full border border-white/10 scale-125 animate-pulse-slow"></div>
                                <div className="absolute inset-0 rounded-full border border-white/5 scale-150 animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
                                <div className="w-20 h-20 md:w-40 md:h-40 relative flex items-center justify-center">
                                    <img src={ELEMENT_ICONS.CIRCLE} alt="Circle" className="w-full h-full object-contain brightness-0 invert" referrerPolicy="no-referrer" />
                                </div>
                                <span className="text-[10px] md:text-[10px] uppercase tracking-widest font-bold text-white whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">Join the circle.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
