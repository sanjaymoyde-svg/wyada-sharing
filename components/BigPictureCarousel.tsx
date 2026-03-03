import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import { BLOG_POSTS } from '../constants';
import { fetchDynamicBlogPosts } from '../services/blogs';
import { BlogPost } from '../types';

interface BigPictureCarouselProps {
  isNight: boolean;
  onArticleOpenChange?: (open: boolean) => void;
}

const formatArticleDate = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ArticleModal: React.FC<{
  article: BlogPost | null;
  onClose: () => void;
}> = ({ article, onClose }) => (
  <AnimatePresence>
    {article && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-[140] bg-white text-black overflow-y-auto"
      >
        <div className="relative min-h-screen">
          <button
            type="button"
            aria-label="Close article"
            onClick={onClose}
            className="fixed top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-md border border-white/10 text-white mix-blend-difference rounded-full transition-colors hover:bg-white/30"
          >
            <X size={32} />
          </button>

          <div className="h-[40vh] md:h-[50vh] w-full relative">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:px-16 md:py-5 text-white max-w-4xl">
              {article.category && (
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-4 inline-block">
                  {article.category}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2">
                {article.title}
              </h1>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm md:text-base opacity-90 font-medium">
                {article.author && <p>By {article.author}</p>}
                {formatArticleDate(article.published_at) && (
                  <>
                    <span className="hidden md:inline">{'\u2022'}</span>
                    <p>{formatArticleDate(article.published_at)}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
            <div
              className="max-w-none"
              dangerouslySetInnerHTML={{ __html: article.body_html || '' }}
            />
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const BigPictureCarousel: React.FC<BigPictureCarouselProps> = ({ isNight, onArticleOpenChange }) => {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const totalSlides = Math.max(posts.length, 1);
  const wheelAccumRef = useRef(0);
  const wheelLockRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      try {
        const livePosts = await fetchDynamicBlogPosts();
        if (!cancelled && livePosts.length > 0) {
          setPosts(livePosts);
          setIndex(0);
        }
      } catch (error) {
        console.error('Failed to load dynamic blog posts:', error);
      }
    };

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (index > totalSlides - 1) {
      setIndex(Math.max(0, totalSlides - 1));
    }
  }, [index, totalSlides]);

  useEffect(() => {
    onArticleOpenChange?.(Boolean(selectedArticle));
  }, [onArticleOpenChange, selectedArticle]);

  useEffect(() => () => {
    onArticleOpenChange?.(false);
  }, [onArticleOpenChange]);

  useEffect(() => {
    if (!selectedArticle) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedArticle(null);
      }
    };

    window.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onEscape);
    };
  }, [selectedArticle]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      setIndex((prev) => Math.min(prev + 1, totalSlides - 1));
    } else if (info.offset.x > threshold) {
      setIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    const isHorizontalIntent = absX > 2 && absX > absY * 1.1;

    if (!isHorizontalIntent) {
      wheelAccumRef.current = 0;
      return;
    }

    event.preventDefault();

    const now = Date.now();
    if (now - wheelLockRef.current < 220) return;

    wheelAccumRef.current += event.deltaX;
    if (Math.abs(wheelAccumRef.current) < 65) return;

    const direction = wheelAccumRef.current > 0 ? 1 : -1;
    wheelAccumRef.current = 0;
    wheelLockRef.current = now;

    setIndex((prev) => {
      if (direction > 0) return Math.min(prev + 1, totalSlides - 1);
      return Math.max(prev - 1, 0);
    });
  };

  const bgColor = isNight ? 'bg-black' : 'bg-[#dcdcdc]';
  const textColor = isNight ? 'text-white' : 'text-black';
  const cardBg = isNight ? 'bg-white/10 border-white/10' : 'bg-black border-none';

  return (
    <>
      <section
        id="element-bigpicture"
        className="relative w-full snap-start snap-always z-[80]"
        style={{ height: 'calc(var(--app-vh) * 2)', marginTop: 'calc(var(--app-vh) * -1)' }}
      >
        <div className={`sticky top-0 w-full ${bgColor} overflow-hidden shadow-[0_-50px_50px_rgba(0,0,0,0.3)] transition-colors duration-700 flex flex-col-reverse md:flex-col`} style={{ height: 'var(--app-vh)' }}>

          {/* TOP: CAROUSEL */}
          <div
            className="w-full md:max-w-[calc(100%-6rem)] h-[65vh] relative flex flex-col justify-start -mt-20 md:mt-0 md:pt-14 overflow-hidden pl-4 "
            onWheel={handleWheel}
          >
            <div className="w-full overflow-visible flex items-center justify-start">
              <motion.div
                className="flex will-change-transform"
                drag="x"
                dragDirectionLock={true}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={{
                  x: `${isMobile
                    ? -(Math.min(index, totalSlides - 1) * 85)
                    : -(Math.min(index, totalSlides - 2) * 38)}vw`
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ touchAction: "pan-y" }}
              >
                {posts.map((post) => (
                  <div key={post.id} className="w-[85vw] md:w-[38vw] flex-shrink-0 flex items-center justify-center p-2">
                    <div className={`relative w-full h-[48vh] md:h-[38vh] rounded-[2rem] overflow-hidden border flex flex-col group ${cardBg}`}>
                      {/* Image Container - Full Card */}
                      <div className="w-full h-full relative overflow-hidden shrink-0">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                        <div className="absolute top-6 left-6">
                          {post.category && (
                            <span className="bg-white/90 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                              {post.category}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/95 via-black/40 to-transparent text-white">
                          <h3 className="text-xl md:text-2xl font-bold leading-tight mb-1 drop-shadow-md">{post.title}</h3>
                          <button
                            type="button"
                            onClick={() => setSelectedArticle(post)}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-2 border-b border-white/30 hover:border-white pb-0.5 w-max"
                          >
                            Read Article <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Navigation */}
            <div className="w-full flex justify-center items-center gap-4 z-30 ">
              <button onClick={() => index > 0 && setIndex(index - 1)} disabled={index === 0} className={`transition-opacity p-2 ${index === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${textColor}`}>
                <ChevronLeft size={24} />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <div key={i} className={`rounded-full transition-all duration-300 ${index === i ? `w-2 h-2 ${isNight ? 'bg-white' : 'bg-black'}` : `w-2 h-2 ${isNight ? 'bg-white/30' : 'bg-black/20'}`}`} />
                ))}
              </div>
              <button onClick={() => index < totalSlides - 1 && setIndex(index + 1)} disabled={index === totalSlides - 1} className={`transition-opacity p-2 ${index === totalSlides - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${textColor}`}>
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Vertical Divider / Shadow Overlay - Simulating 'coming from right' panel */}
            <div className="hidden md:block absolute right-0 top-0 h-full w-[2px] bg-black/30 z-40" style={{ boxShadow: '-15px 0 30px rgba(0,0,0,0.3)' }}></div>
          </div>

          {/* COMMUNITY STORIES Label - Mobile Only - Above Menu */}
          <div className="md:hidden absolute bottom-20 left-0 right-0 w-full px-4 py-2 flex items-center justify-center gap-2 z-50 pointer-events-none pb-2">
            <Users size={14} className="text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Community Stories</span>
          </div>

          {/* BOTTOM: TEXT */}
          <div className="shrink-0 w-full h-[41vh] text-left pl-4 pr-16 md:px-16 z-10 flex flex-col items-start justify-start pt-24 md:pt-4 relative">
            <p className={`text-sm md:text-xl leading-relaxed ${textColor} max-w-2xl mb-2`}>
              Urban wellness is bigger than a product and a brand. So join us, as we take a step back to look at the...
            </p>
            <h2 className={`text-4xl md:text-7xl font-black tracking-tight ${textColor} leading-none`}>big picture.</h2>
          </div>

        </div>
      </section>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </>
  );
};
