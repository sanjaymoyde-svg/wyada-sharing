
import { Ingredient, BlogPost } from './types';

// REPLACEMENT INSTRUCTION:
// Using Google Content CDN (lh3) which often bypasses Drive viewer restrictions
export const LOGO_URL = "https://lh3.googleusercontent.com/d/1dz2UDcrD_rdeqGTQH2DZqqgOB4auiTyw";

export const ELEMENT_ICONS = {
  EARTH: "https://lh3.googleusercontent.com/d/1FnwqtZ10b6YNE8nEqNidvt_T2WUHaJu7",
  WATER: "https://lh3.googleusercontent.com/d/1ZO-iimGLvxAV6n0VzCg9NFrUCgXWRnto",
  FIRE: "https://lh3.googleusercontent.com/d/1bQQrJFvazL0b3fxZYXQAHBULRST7uzwl",
  AIR: "https://lh3.googleusercontent.com/d/1ndHVsZdmng-TDDafHe5K8Fe1CNWCpMTU",
  ETHER: "https://lh3.googleusercontent.com/d/1Y9a_kTYsMDWL9ZBsVEjTPgn7C9J8Grsb",
  ORIGIN: "https://lh3.googleusercontent.com/d/1FQh1aJhXXisLK9rWP2Q7vZO-hwwfCwzx",
  FUTURE: "https://lh3.googleusercontent.com/d/1uEs3AAawIFF-RbcMrOmAbnO51eAkG1Eq",
  CIRCLE: "https://lh3.googleusercontent.com/d/1QaP6tBwiJwOzcde1Qq79pifKXK61VqLC",
  SLIDER_THUMB: "https://lh3.googleusercontent.com/d/1KC091HJibC-zc7W6WJPjr2ZWmkY1xNg0"
};

export const INGREDIENTS: Ingredient[] = [
  { symbol: 'Ni', name: 'Niacinamide', number: 1, benefit: 'Strengthens skin barrier and improves texture.', category: 'barrier' },
  { symbol: 'Ha', name: 'Hyaluronic Acid', number: 2, benefit: 'Deep hydration holding 1000x its weight in water.', category: 'hydration' },
  { symbol: 'Ka', name: 'Kaolin Clay', number: 3, benefit: 'Gently absorbs impurities without stripping oil.', category: 'detox' },
  { symbol: 'Ce', name: 'Ceramides', number: 4, benefit: 'Restores protective skin lipids.', category: 'barrier' },
  { symbol: 'Zn', name: 'Zinc Oxide', number: 5, benefit: 'Broad spectrum physical UV protection.', category: 'active' },
  { symbol: 'Mg', name: 'Magnesium', number: 6, benefit: 'Calms inflammation and repairs cells.', category: 'active' },
  { symbol: 'Al', name: 'Aloe Vera', number: 7, benefit: 'Instant cooling and soothing relief.', category: 'hydration' },
  { symbol: 'Te', name: 'Green Tea', number: 8, benefit: 'Antioxidant powerhouse against city pollution.', category: 'detox' },
];

export const BLOG_POSTS: BlogPost[] = [
  { id: 1, title: 'Circadian Rhythms & Skin Health', category: 'Science', image: 'https://picsum.photos/600/400?random=1' },
  { id: 2, title: 'Urban Pollution: The Invisible Enemy', category: 'City Life', image: 'https://picsum.photos/600/400?random=2' },
  { id: 3, title: 'Why "Natural" Isn\'t Enough', category: 'Philosophy', image: 'https://picsum.photos/600/400?random=3' },
  { id: 4, title: 'The Art of Doing Nothing', category: 'Wellness', image: 'https://picsum.photos/600/400?random=4' },
];

export type HomeElement = 'origin' | 'elements' | 'earth' | 'water' | 'future' | 'circle' | 'bigpicture';

export const SECTION_CONFIG: Record<HomeElement, { color: string; path: string }> = {
  origin: { color: '#c4cd50', path: '/' },
  elements: { color: '#bca2d1', path: '/element-intro' },
  earth: { color: '#d99058', path: '/mesa' },
  water: { color: '#73a5d3', path: '/crest' },
  future: { color: '#0b1630', path: '/upcoming' },
  circle: { color: '#94b8b4', path: '/community' },
  bigpicture: { color: '#dcdcdc', path: '/bigpicture' }
};

export const SNAP_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const SNAP_ELEMENT_MAP: Record<(typeof SNAP_STEPS)[number], HomeElement> = {
  0: 'origin',
  1: 'origin',
  2: 'origin',
  3: 'origin',
  4: 'origin',
  5: 'elements',
  6: 'earth',
  7: 'water',
  8: 'future',
  9: 'circle',
  10: 'bigpicture'
};
