/**
 * Cloudflare Pages Function - OG Tag Injection for Social Crawlers
 * 
 * This function intercepts requests to product pages and injects
 * Open Graph meta tags for social media link previews.
 */

interface Env {
    FIREBASE_PROJECT_ID: string;
}

interface Product {
    name: string;
    description: string;
    images?: string[];
    imageUrl?: string;
    price?: number;
    salePrice?: number;
    sizeVariants?: Array<{
        images?: string[];
    }>;
}

// Social media crawler User-Agent patterns
const SOCIAL_CRAWLERS = [
    'facebookexternalhit',
    'Facebot',
    'WhatsApp',
    'Twitterbot',
    'LinkedInBot',
    'TelegramBot',
    'Discordbot',
    'Slackbot',
    'Pinterest',
    'vkShare',
    'Googlebot', // For Google rich results
];

function isSocialCrawler(userAgent: string | null): boolean {
    if (!userAgent) return false;
    return SOCIAL_CRAWLERS.some(crawler =>
        userAgent.toLowerCase().includes(crawler.toLowerCase())
    );
}

function extractProductId(pathname: string): string | null {
    const match = pathname.match(/^\/product\/([^\/]+)$/);
    return match ? match[1] : null;
}

async function fetchProductFromFirebase(projectId: string, productId: string): Promise<Product | null> {
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${productId}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Firebase fetch failed: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.fields) {
            return null;
        }

        // Parse Firestore document format
        const fields = data.fields;

        // Extract images from sizeVariants or direct images array
        let images: string[] = [];

        if (fields.sizeVariants?.arrayValue?.values) {
            for (const variant of fields.sizeVariants.arrayValue.values) {
                if (variant.mapValue?.fields?.images?.arrayValue?.values) {
                    for (const img of variant.mapValue.fields.images.arrayValue.values) {
                        if (img.stringValue) {
                            images.push(img.stringValue);
                        }
                    }
                }
            }
        }

        if (fields.images?.arrayValue?.values) {
            for (const img of fields.images.arrayValue.values) {
                if (img.stringValue) {
                    images.push(img.stringValue);
                }
            }
        }

        return {
            name: fields.name?.stringValue || 'Product',
            description: fields.description?.stringValue || '',
            images: images.length > 0 ? images : undefined,
            imageUrl: fields.imageUrl?.stringValue,
            price: fields.price?.integerValue ? parseInt(fields.price.integerValue) : undefined,
            salePrice: fields.salePrice?.integerValue ? parseInt(fields.salePrice.integerValue) : undefined,
        };
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

function generateOgHtml(product: Product, url: string, baseHtml: string): string {
    const title = product.name;
    const description = product.description
        ? product.description.substring(0, 200) + (product.description.length > 200 ? '...' : '')
        : 'Check out this product!';

    // Get the first available image
    const image = product.images?.[0] || product.imageUrl || '';

    // Format price for description
    let priceText = '';
    if (product.salePrice) {
        priceText = `₹${product.salePrice}`;
    } else if (product.price) {
        priceText = `₹${product.price}`;
    }

    const fullDescription = priceText ? `${priceText} - ${description}` : description;

    // Create OG meta tags
    const ogTags = `
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(fullDescription)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Amilei eCollection" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(fullDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  `;

    // Inject OG tags into head, replacing existing ones
    let modifiedHtml = baseHtml;

    // Remove existing OG tags
    modifiedHtml = modifiedHtml.replace(/<meta property="og:[^"]*"[^>]*>/g, '');
    modifiedHtml = modifiedHtml.replace(/<meta name="twitter:[^"]*"[^>]*>/g, '');

    // Inject new OG tags before </head>
    modifiedHtml = modifiedHtml.replace('</head>', ogTags + '\n</head>');

    // Update title tag
    modifiedHtml = modifiedHtml.replace(
        /<title>[^<]*<\/title>/,
        `<title>${escapeHtml(title)} | Amilei eCollection</title>`
    );

    return modifiedHtml;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, next } = context;
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent');

    // Only intercept for social crawlers on product pages
    const productId = extractProductId(url.pathname);

    if (!productId || !isSocialCrawler(userAgent)) {
        // Pass through to static files / SPA
        return next();
    }

    console.log(`Social crawler detected: ${userAgent?.substring(0, 50)}`);

    // Fetch the base HTML (index.html from dist)
    const baseResponse = await next();
    const baseHtml = await baseResponse.text();

    // Fetch product data from Firebase
    const projectId = env.FIREBASE_PROJECT_ID || 'udfs-fc4c7';
    const product = await fetchProductFromFirebase(projectId, productId);

    if (!product) {
        // Return original HTML if product not found
        return new Response(baseHtml, {
            headers: { 'content-type': 'text/html' },
        });
    }

    // Generate modified HTML with OG tags
    const modifiedHtml = generateOgHtml(product, url.toString(), baseHtml);

    return new Response(modifiedHtml, {
        headers: { 'content-type': 'text/html' },
    });
};
