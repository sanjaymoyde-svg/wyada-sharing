
import React, { memo, useMemo } from 'react';
import { Mountain, Waves, Fingerprint, Sparkles, Hourglass, Globe, GalleryHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ELEMENT_ICONS } from '../constants';

interface ElementIndicatorProps {
    active: 'origin' | 'elements' | 'earth' | 'water' | 'future' | 'circle' | 'bigpicture' | null;
    snapped: 'origin' | 'elements' | 'earth' | 'water' | 'future' | 'circle' | 'bigpicture' | null;
    isNight: boolean;
    expanded?: boolean;
    originStep?: number;
    onNavigate: (index: number) => void;
    onViewProduct?: (type: 'mesa' | 'crest') => void;
}

interface ElementItem {
    id: string;
    iconSrc: string | null;
    fallback: React.ElementType;
    label: string;
    clickable: boolean;
    isChild: boolean;
    title?: string;
    description?: string;
    color?: string;
}

interface IndicatorItemProps {
    el: ElementItem;
    active: string | null;
    snapped: string | null;
    expanded: boolean;
    isNight: boolean;
    originStep: number;
    TOTAL_ORIGIN_STEPS: number;
    onNavigate: (index: number) => void;
    onViewProduct?: (type: 'mesa' | 'crest') => void;
}

const IndicatorItem = memo(({
    el,
    active,
    snapped,
    expanded,
    isNight,
    originStep,
    TOTAL_ORIGIN_STEPS,
    onNavigate,
    onViewProduct
}: IndicatorItemProps) => {
    const isActive = active === el.id;
    const isSnapped = snapped === el.id;

    const showFullOpacity = expanded || isActive;

    const opacityClass = !el.clickable && !expanded && !isActive
        ? 'opacity-20'
        : showFullOpacity
            ? 'opacity-100'
            : 'opacity-40 group-hover:opacity-80';

    const baseSize = expanded ? 32 : 20;
    const size = el.isChild ? baseSize * 0.7 : baseSize;


    const handleScrollTo = () => {
        if (!el.clickable) return;



        let screenIndex = 0;
        if (el.id === 'origin') screenIndex = 0;
        else if (el.id === 'elements') screenIndex = 5.0;
        else if (el.id === 'earth') screenIndex = 6.0;
        else if (el.id === 'water') screenIndex = 7.0;
        else if (el.id === 'future') screenIndex = 8.0;
        else if (el.id === 'circle') screenIndex = 9.0;
        else if (el.id === 'bigpicture') screenIndex = 10.0;

        onNavigate(screenIndex);
    };

    const handleDashClick = (e: React.MouseEvent, stepIndex: number) => {
        e.stopPropagation();
        e.preventDefault();
        onNavigate(stepIndex * 1.0); // Map 0-4 dashes to 0, 1, 2, 3, 4 screens
    };

    return (
        <div className="flex flex-col items-end justify-center relative group">
            <div
                className={`flex flex-col items-end transition-all duration-300 ${opacityClass} ${showFullOpacity && expanded ? 'scale-110' : 'scale-100'
                    }`}
            >
                <motion.button
                    onClick={(e) => {
                        e.preventDefault();
                        handleScrollTo();
                    }}
                    disabled={!el.clickable}
                    animate={isSnapped ? {
                        scale: 1,
                        filter: isNight ? 'drop-shadow(0 0 8px rgba(196, 205, 80, 0.6))' : 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
                    } : { scale: 1, filter: 'none' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative flex items-center justify-center transition-all duration-500 outline-none will-change-transform ${el.clickable ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{ width: size, height: size }}
                    aria-label={el.clickable ? `Scroll to ${el.label}` : `${el.label} (Coming Soon)`}
                >
                    {el.iconSrc ? (
                        <>
                            <img
                                src={el.iconSrc}
                                alt={el.label}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-contain select-none ${isNight ? 'filter-brand-lime' : ''}`}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center">
                                <el.fallback
                                    size={size}
                                    strokeWidth={isActive || expanded ? 2 : 1.5}
                                    className="transition-all duration-500"
                                />
                            </div>
                        </>
                    ) : (
                        <el.fallback
                            size={size}
                            strokeWidth={isActive || expanded ? 2 : 1.5}
                        />
                    )}
                </motion.button>

                {el.id === 'origin' && active === 'origin' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 36, marginTop: 8 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="flex flex-col gap-1.5 w-full will-change-[height,opacity]"
                    >
                        {Array.from({ length: TOTAL_ORIGIN_STEPS }).map((_, i) => {
                            const isActiveDash = originStep === i;

                            return (
                                <div
                                    key={i}
                                    onClick={(e) => handleDashClick(e, i)}
                                    className={`h-[2px] rounded-full transition-all duration-300 cursor-pointer ml-auto ${isActiveDash
                                        ? 'bg-current opacity-100 w-5'
                                        : 'bg-current opacity-30 hover:opacity-60 w-3'
                                        }`}
                                />
                            );
                        })}
                    </motion.div>
                )}

                <span
                    style={{ top: size / 2 }}
                    className={`absolute right-full mr-4 -translate-y-1/2 text-[10px] font-bold tracking-wider whitespace-nowrap text-right transition-all duration-500 leading-none
                        ${(active === 'origin' && originStep === 0) ? 'opacity-100' : 'opacity-0'}
                        ${(expanded || active === 'origin') ? 'md:opacity-100 md:group-hover:opacity-0' : 'md:opacity-0'}
                    `}
                >
                    {el.label}
                </span>


            </div>
        </div >
    );
});

export const ElementIndicator: React.FC<ElementIndicatorProps> = ({ active, snapped, isNight, expanded = false, originStep = 0, onNavigate, onViewProduct }) => {
    const elements: ElementItem[] = useMemo(() => [
        { id: 'origin', iconSrc: ELEMENT_ICONS.ORIGIN, fallback: Fingerprint, label: 'the paradox', clickable: true, isChild: false, title: 'THE WAY', description: 'Origin Story', color: 'text-brand-lime' },
        { id: 'elements', iconSrc: null, fallback: Sparkles, label: 'ELEMENTS', clickable: true, isChild: false, title: 'THE ELEMENTS', description: 'Nature\'s Code', color: 'text-purple-500' },
        { id: 'earth', iconSrc: ELEMENT_ICONS.EARTH, fallback: Mountain, label: 'MESA', clickable: true, isChild: true, title: 'MESA', description: 'Cleansing Mud', color: 'text-brand-mesa' },
        { id: 'water', iconSrc: ELEMENT_ICONS.WATER, fallback: Waves, label: 'CREST', clickable: true, isChild: true, title: 'CREST', description: 'Skin Sorbet', color: 'text-brand-crest' },
        { id: 'future', iconSrc: ELEMENT_ICONS.FUTURE, fallback: Hourglass, label: 'LABS', clickable: true, isChild: true, title: 'LABS', description: 'Future Formulations', color: 'text-blue-500' },
        { id: 'circle', iconSrc: ELEMENT_ICONS.CIRCLE, fallback: Globe, label: 'CIRCLE', clickable: true, isChild: false, title: 'CIRCLE', description: 'Community', color: 'text-[#9FC1C0]' },
        { id: 'bigpicture', iconSrc: null, fallback: GalleryHorizontal, label: 'BIG PICTURE', clickable: true, isChild: false, title: 'BIG PICTURE', description: 'The Vision', color: isNight ? 'text-white' : 'text-black' },
    ], [isNight]);

    const TOTAL_ORIGIN_STEPS = 5;
    const showChildren = snapped === 'elements' || snapped === 'earth' || snapped === 'water' || snapped === 'future';

    return (
        <div className={`fixed right-6 md:right-8 top-0 h-[var(--app-vh)] z-[140] flex flex-col items-end justify-start pt-20 gap-6 pointer-events-none ${isNight ? 'text-brand-lime' : 'text-white'}`}>
            <div className={`flex flex-col items-end pointer-events-auto transition-all duration-500 ${expanded ? 'bg-black/20 backdrop-blur-xl p-4 rounded-2xl' : ''}`}>
                {elements.map((el, index) => {
                    const isChildVisible = !el.isChild || showChildren;
                    const isLast = index === elements.length - 1;

                    return (
                        <motion.div
                            key={el.id}
                            initial={false}
                            animate={{
                                height: isChildVisible ? 'auto' : 0,
                                opacity: isChildVisible ? 1 : 0,
                                marginBottom: isChildVisible && !isLast ? 16 : 0,
                                scale: isChildVisible ? 1 : 0.8
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                                mass: 0.8,
                                opacity: { duration: 0.2 }
                            }}
                            className="flex flex-col items-end origin-right will-change-[height,opacity,transform]"
                        >
                            <IndicatorItem
                                el={el}
                                active={active}
                                snapped={snapped}
                                expanded={expanded}
                                isNight={isNight}
                                originStep={originStep}
                                TOTAL_ORIGIN_STEPS={TOTAL_ORIGIN_STEPS}
                                onNavigate={onNavigate}
                                onViewProduct={onViewProduct}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
