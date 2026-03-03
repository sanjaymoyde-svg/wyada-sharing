import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Manifesto } from '../components/Manifesto';
import { Toast } from '../components/Toast';
import { FloatingBar } from '../components/FloatingBar';
import { ElementsIntro } from '../components/ElementsIntro';
import { EarthCarousel } from '../components/EarthCarousel';
import { WaterCarousel } from '../components/WaterCarousel';
import { ComingSoonCarousel } from '../components/ComingSoonCarousel';
import { CircleIntro } from '../components/CircleIntro';
import { BigPictureCarousel } from '../components/BigPictureCarousel';
import { useScroll, useTransform } from 'framer-motion';
import { ElementIndicator } from '../components/ElementIndicator';
import { CartItem, Product } from '../types';
import { HomeElement, SECTION_CONFIG, SNAP_ELEMENT_MAP } from '../constants';
import { useScrollSnap } from '../hooks/useScrollSnap';

interface HomeProps {
    isNight: boolean;
    toggleTheme: () => void;
    cartItems: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (id: string) => void;
    updateCartQuantity: (id: string, quantity: number) => void;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    earthProduct: Product | null;
    waterProduct: Product | null;
    allProducts: Product[];
    showToast: boolean;
    setShowToast: (show: boolean) => void;
    initialSection?: HomeElement;
    initialMenuOpen?: boolean;
    initialCartOpen?: boolean;
}

const MANIFESTO_RETURN_INDEX = 4;
const LAST_PATH_STORAGE_KEY = 'wayda:last-path';
const LAST_PATH_MAX_AGE_MS = 15000;

export const Home: React.FC<HomeProps> = ({
    isNight,
    toggleTheme,
    cartItems,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    isCartOpen,
    setIsCartOpen,
    isMenuOpen,
    setIsMenuOpen,
    earthProduct,
    waterProduct,
    allProducts,
    showToast,
    setShowToast,
    initialSection,
    initialMenuOpen,
    initialCartOpen
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isArticleOpen, setIsArticleOpen] = useState(false);
    const [hideLogo, setHideLogo] = useState(false);

    const {
        activeElement,
        snappedElement,
        originStep,
        handleNavigate,
        viewportHeightRef,
        getVh
    } = useScrollSnap({ isMenuOpen, isCartOpen, isArticleOpen });

    const { scrollY } = useScroll();
    const scrollIndex = useTransform(scrollY, (latest) => {
        return latest / viewportHeightRef.current;
    });

    const [previousPath, setPreviousPath] = useState<string | null>(null);

    // Initial Path Tracking (SSR Safe)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.sessionStorage.getItem(LAST_PATH_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as { path?: unknown; updatedAt?: unknown };
                if (typeof parsed.path === 'string' && typeof parsed.updatedAt === 'number') {
                    if ((Date.now() - parsed.updatedAt) <= LAST_PATH_MAX_AGE_MS) {
                        setPreviousPath(parsed.path);
                    }
                }
            }
        } catch { /* ignore */ }
    }, []);

    // Handle path-based initial deep links
    useEffect(() => {
        if (!initialSection || typeof window === 'undefined') return;

        const cameFromElementsIntro = location.pathname === '/' && previousPath === '/element-intro';

        const timeoutId = window.setTimeout(() => {
            let targetIndex = 0;
            if (cameFromElementsIntro) {
                targetIndex = MANIFESTO_RETURN_INDEX;
            } else {
                const step = (Object.entries(SNAP_ELEMENT_MAP) as any).find(
                    ([_, element]: [any, HomeElement]) => element === initialSection
                );
                targetIndex = step ? parseInt(step[0]) : 0;
            }

            window.scrollTo({ top: targetIndex * getVh(), behavior: 'auto' });
        }, 100);
        return () => window.clearTimeout(timeoutId);
    }, [getVh, initialSection, location.pathname, previousPath]);

    // Update URL and Theme on Scroll or State Change
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. URL Syncing
        let currentPath = '/';
        if (isCartOpen) currentPath = '/cart';
        else if (isMenuOpen) currentPath = '/menu';
        else if (activeElement) {
            currentPath = SECTION_CONFIG[activeElement]?.path || '/';
        }

        if (window.location.pathname !== currentPath) {
            window.history.replaceState(null, '', currentPath);
        }

        // 2. Theme Syncing (Address Bar + Body)
        const activeColor = isNight ? '#020408' : (activeElement ? SECTION_CONFIG[activeElement].color : '#c4cd50');

        // Force strict styling for mobile browsers that resist CSS transitions
        const transitionStyle = 'background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.style.setProperty('transition', transitionStyle, 'important');
        document.documentElement.style.setProperty('transition', transitionStyle, 'important');

        document.body.style.backgroundColor = activeColor;
        document.documentElement.style.backgroundColor = activeColor;
        document.documentElement.style.setProperty('--current-theme', activeColor);

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', activeColor);
        } else {
            const meta = document.head.querySelector('meta[name="theme-color"]') || document.createElement('meta');
            (meta as any).name = 'theme-color';
            (meta as any).content = activeColor;
            if (!document.head.contains(meta)) document.head.appendChild(meta);
        }
    }, [activeElement, isMenuOpen, isCartOpen, isNight]);

    // Track Navigation Context
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.sessionStorage.setItem(
                LAST_PATH_STORAGE_KEY,
                JSON.stringify({ path: location.pathname, updatedAt: Date.now() })
            );
        } catch { /* ignore */ }
    }, [location.pathname]);

    // Handle Initial Menu/Cart
    useEffect(() => {
        if (initialMenuOpen) setIsMenuOpen(true);
        if (initialCartOpen) setIsCartOpen(true);
    }, [initialMenuOpen, initialCartOpen, setIsMenuOpen, setIsCartOpen]);

    const handleViewProduct = (type: 'mesa' | 'crest') => {
        navigate(`/product/${type}`);
    };

    const bgClass = isNight ? 'bg-brand-night' : 'bg-[var(--current-theme)]';

    return (
        <div
            className={`app relative w-full ${bgClass} font-sans font-medium overscroll-y-none transition-colors duration-700`}
            style={{
                minHeight: 'var(--app-vh, 100vh)',
                backgroundColor: isNight ? '#020408' : (activeElement ? SECTION_CONFIG[activeElement].color : '#c4cd50'),
                transition: 'background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <Navbar isNight={isNight} hideLogo={hideLogo} onLogoClick={() => handleNavigate(0)} />
            <ElementIndicator
                isNight={isNight}
                active={activeElement}
                snapped={snappedElement}
                originStep={originStep}
                onNavigate={handleNavigate}
                onViewProduct={handleViewProduct}
            />
            <Toast show={showToast} message="Blue light reduced." onClose={() => setShowToast(false)} />

            <main
                className="w-full relative"
                data-snapped={snappedElement || 'none'}
            >
                <Manifesto isNight={isNight} />
                <ElementsIntro setLogoHidden={setHideLogo} products={allProducts} />
                <EarthCarousel
                    isNight={isNight}
                    progress={scrollIndex}
                    isActive={activeElement === 'earth'}
                    addToCart={() => addToCart({
                        id: 'mesa',
                        variantId: earthProduct?.variants?.[0]?.id || 0,
                        name: earthProduct?.title || 'mesa',
                        price: earthProduct?.variants[0]?.price ? Number(earthProduct.variants[0].price) : 799,
                        color: '#E89C6C'
                    })}
                    onView={() => handleViewProduct('mesa')}
                    product={earthProduct}
                />
                <WaterCarousel
                    isNight={isNight}
                    progress={scrollIndex}
                    isActive={activeElement === 'water'}
                    addToCart={() => addToCart({
                        id: 'crest',
                        variantId: waterProduct?.variants?.[0]?.id || 0,
                        name: waterProduct?.title || 'crest',
                        price: waterProduct?.variants[0]?.price ? Number(waterProduct.variants[0].price) : 1299,
                        color: '#5D9BCE'
                    })}
                    onView={() => handleViewProduct('crest')}
                    product={waterProduct}
                />
                <ComingSoonCarousel isNight={isNight} />
                <CircleIntro setLogoHidden={setHideLogo} />
                <BigPictureCarousel isNight={isNight} onArticleOpenChange={setIsArticleOpen} />
            </main>

            <FloatingBar
                isNight={isNight}
                toggleTheme={toggleTheme}
                cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                cartItems={cartItems}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                onRemoveItem={removeFromCart}
                addToCart={addToCart}
                onViewProduct={handleViewProduct}
                earthProduct={earthProduct}
                waterProduct={waterProduct}
                updateCartQuantity={updateCartQuantity}
                isVisible={!isArticleOpen}
            />

            <footer className={`relative z-[90] py-10 text-center text-sm ${isNight ? 'bg-black text-brand-lime/40' : 'bg-brand-lime text-white/40'}`}>
                &copy; {new Date().getFullYear()} way'da wellness.
            </footer>
        </div>
    );
};
