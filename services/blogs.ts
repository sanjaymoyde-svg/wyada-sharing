import { BlogPost } from '../types';
import { buildApiUrl } from '../utils/api';

interface ShopifyBlog {
    id: number | string;
    title?: string;
}

interface ShopifyArticle {
    id: number | string;
    title?: string;
    body_html?: string;
    summary_html?: string;
    author?: string;
    published_at?: string;
    tags?: string;
    blog_id?: number | string;
    image?: {
        src?: string;
    };
}

const BLOGS_ENDPOINT = buildApiUrl('/api/blogs');
const BLOG_ARTICLES_ENDPOINT = (blogId: number | string) => buildApiUrl(`/api/blogs/articles/${blogId}`);

const fallbackImages = [
    'https://picsum.photos/1200/800?random=11',
    'https://picsum.photos/1200/800?random=12',
    'https://picsum.photos/1200/800?random=13',
    'https://picsum.photos/1200/800?random=14',
];

const pickCategory = (tags: string | undefined, blogTitle: string | undefined): string => {
    const firstTag = tags
        ?.split(',')
        .map((tag) => tag.trim())
        .find(Boolean);

    if (firstTag) return firstTag;
    if (blogTitle) return blogTitle;
    return 'Community';
};

const mapArticle = (article: ShopifyArticle, blogTitle: string | undefined, fallbackImage: string): BlogPost => ({
    id: Number(article.id),
    title: article.title?.trim() || 'Untitled Article',
    category: pickCategory(article.tags, blogTitle),
    image: article.image?.src || fallbackImage,
    body_html: article.body_html,
    summary_html: article.summary_html,
    author: article.author,
    published_at: article.published_at,
    blog_title: blogTitle,
});

export const fetchDynamicBlogPosts = async (): Promise<BlogPost[]> => {
    const blogsResponse = await fetch(BLOGS_ENDPOINT);
    if (!blogsResponse.ok) {
        throw new Error(`Failed to fetch blogs: ${blogsResponse.statusText}`);
    }

    const blogs: ShopifyBlog[] = await blogsResponse.json();
    if (!Array.isArray(blogs) || blogs.length === 0) return [];

    const articleResponses = await Promise.all(
        blogs.map(async (blog) => {
            const response = await fetch(BLOG_ARTICLES_ENDPOINT(blog.id));
            if (!response.ok) return [];
            const articles: ShopifyArticle[] = await response.json();
            if (!Array.isArray(articles)) return [];

            return articles.map((article, index) =>
                mapArticle(article, blog.title, fallbackImages[index % fallbackImages.length]),
            );
        }),
    );

    return articleResponses
        .flat()
        .sort((a, b) => {
            const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
            const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
            return bTime - aTime;
        });
};
