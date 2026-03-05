import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { LOGO_URL, ELEMENT_ICONS } from '../constants';

interface ElementsIntroProps {
    setLogoHidden: (hidden: boolean) => void;
    products?: any[];
}

export const ElementsIntro: React.FC<ElementsIntroProps> = ({ setLogoHidden, products = [] }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
    const [imgError, setImgError] = useState(false);
    const lastHiddenState = useRef<boolean | null>(null);
    const [isProxyActive, setProxyActive] = useState(false);
    const [activeDescription, setActiveDescription] = useState<string>("");

    const defaultDesc = "Start where your body meets the world. A <span class=\"font-extrabold\">personal care</span> system inspired by the 5 fundamental forces of nature.";

    useEffect(() => {
        const updateVh = () => setVh(window.innerHeight);
        updateVh();
        window.addEventListener('resize', updateVh);
        return () => window.removeEventListener('resize', updateVh);
    }, []);

    // Set initial description
    useEffect(() => {
        setActiveDescription(defaultDesc);
    }, []);


    // --- SCROLL LOGIC ---
    // Peak at 5.1vh (Arrival at Elements Intro)
    const scrollStart = vh * 4.8;
    const scrollPeak = vh * 5.1;
    const scrollEnd = vh * 5.4;

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

    const elementsList = [
        { name: 'Earth', icon: ELEMENT_ICONS.EARTH },
        { name: 'Water', icon: ELEMENT_ICONS.WATER },
        { name: 'Fire', icon: ELEMENT_ICONS.FIRE },
        { name: 'Air', icon: ELEMENT_ICONS.AIR },
        { name: 'Ether', icon: ELEMENT_ICONS.ETHER },
    ];

    const handleIconClick = (name: string) => {
        let screenIndex = 0;
        if (name === 'Earth') screenIndex = 8.0; // Starts at 8.0
        else if (name === 'Water') screenIndex = 9.0; // Starts at 9.0
        else screenIndex = 10.0; // Future starts at 10.0

        const vhVal = window.innerHeight;
        window.scrollTo({ top: (screenIndex * vhVal), behavior: 'smooth' });
    };

    const handleIconHover = (name: string) => {
        const product = products.find(p => p.title.toLowerCase().includes(name.toLowerCase()) || p.title.toLowerCase() === name.toLowerCase());
        if (product?.body_html) {
            // Extract text from paragraph p, simple parse
            const tmp = document.createElement("DIV");
            tmp.innerHTML = product.body_html;
            const text = tmp.textContent || tmp.innerText || "";
            setActiveDescription(text || defaultDesc);
        } else {
            // Fallback logic for Aether -> Ether mapping if needed, or default
            if (name === 'Ether') {
                const aether = products.find(p => p.title === 'Aether');
                if (aether?.body_html) {
                    const tmp = document.createElement("DIV");
                    tmp.innerHTML = aether.body_html;
                    const text = tmp.textContent || tmp.innerText || "";
                    setActiveDescription(text);
                    return;
                }
            }
            setActiveDescription(defaultDesc);
        }
    };

    return (
        <section
            id="section-elements"
            ref={containerRef}
            // h-[200vh] ensures this stays pinned at top while next section (Earth) slides in from 16.0vh
            // -mt-[1px] fixes the green line gap issue by overlapping slightly
            className="relative h-[200vh] w-full snap-start snap-always z-[30] -mt-[1px]"
        >
            <div className="sticky top-0 h-[100dvh] w-full bg-[#bca2d1] overflow-hidden flex flex-col items-center justify-start">

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
                        Elements
                    </div>
                </div>

                <div className="w-full h-full relative z-10 flex flex-col items-start px-6 md:px-16 justify-end pb-72 md:justify-start md:pt-[35vh] md:pb-0">
                    <div className="max-w-2xl flex flex-col justify-start">
                        <h2 className="text-4xl md:text-6xl font-bold text-white leading-none mb-2">skin.</h2>
                        <h3 className="text-lg md:text-2xl font-medium italic text-white/80 leading-tight mb-6 md:mb-8">your first line of defence.</h3>
                        <p className="text-base md:text-lg font-medium leading-relaxed text-white/90" dangerouslySetInnerHTML={{ __html: activeDescription || defaultDesc }} />
                    </div>

                    <div className="mt-8 md:mt-0 w-full md:w-auto md:absolute md:right-[10vw] md:top-1/2 md:-translate-y-1/2 pointer-events-auto z-50">

                        {/* MOBILE: Single Line, Uniform Size - Pinned to Bottom */}
                        <div className="absolute bottom-48 left-0 w-full grid grid-cols-5 place-items-center px-4 md:hidden z-50">
                            {elementsList.map((el, i) => (
                                <div
                                    key={el.name}
                                    onClick={() => i < 2 && handleIconClick(el.name)} // Only enable click for active elements (Earth/Water)
                                    className={`flex flex-col items-center gap-2 ${i < 2 ? 'cursor-pointer opacity-100' : 'cursor-default opacity-50'}`}
                                >
                                    <div className="w-14 h-14 relative flex items-center justify-center">
                                        <img
                                            src={el.icon}
                                            alt={el.name}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-contain brightness-0 invert select-none"
                                        />
                                    </div>
                                    <span className="text-[9px] uppercase tracking-widest font-bold text-white">{el.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* DESKTOP: Pyramid Layout (Restored) - Icons sized/spaced as per new design */}
                        <div className="max-md:hidden flex flex-col items-center gap-10">
                            {/* ACTIVE ELEMENTS (Top of Pyramid) */}
                            <div className="flex items-center gap-16">
                                {elementsList.slice(0, 2).map((el, i) => (
                                    <motion.div
                                        key={el.name}
                                        onClick={() => handleIconClick(el.name)}
                                        onMouseEnter={() => handleIconHover(el.name)}
                                        onMouseLeave={() => setActiveDescription(defaultDesc)}
                                        whileHover={{ scale: 1.1, opacity: 1 }}
                                        className="flex flex-col items-center gap-4 group cursor-pointer opacity-100"
                                    >
                                        <div className="w-20 h-20 relative flex items-center justify-center">
                                            <img
                                                src={el.icon}
                                                alt={el.name}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-contain brightness-0 invert select-none transition-transform duration-300 group-hover:scale-110"
                                            />
                                        </div>
                                        <span className="text-sm uppercase tracking-widest font-bold text-white group-hover:opacity-100 transition-opacity duration-300">{el.name}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* COMING SOON ELEMENTS (Base of Pyramid) */}
                            <div className="flex items-center gap-12">
                                {elementsList.slice(2).map((el, i) => (
                                    <motion.div
                                        key={el.name}
                                        className="flex flex-col items-center gap-3 group cursor-default opacity-40"
                                    >
                                        <div className="w-20 h-20 relative flex items-center justify-center">
                                            <img
                                                src={el.icon}
                                                alt={el.name}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-contain brightness-0 invert select-none"
                                            />
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-white">{el.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hidden snap anchor to prevent getting "stuck" between Manifesto and Skin */}
                <div className="absolute top-[2vh] w-full h-1 snap-center pointer-events-none opacity-0" />

                <div className="absolute bottom-20 md:bottom-24 left-0 right-0 flex flex-col items-center justify-center text-white z-20 gap-2 pointer-events-none">
                    <p className="text-xs md:text-sm font-extrabold uppercase tracking-widest opacity-90 scale-90 drop-shadow-md">5 elements. 1 routine.</p>
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="text-white">
                        <ChevronDown size={24} strokeWidth={3} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
