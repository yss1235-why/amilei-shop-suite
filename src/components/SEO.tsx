import { Helmet } from 'react-helmet-async';
import { useStore } from '@/contexts/StoreContext';

interface SEOProps {
    title?: string;
    description?: string;
}

const SEO = ({ title, description }: SEOProps) => {
    const { settings } = useStore();

    const pageTitle = title
        ? `${title} | ${settings?.storeName || 'Store'}`
        : settings?.storeName || 'Store';

    const pageDescription = description || settings?.description || '';

    return (
        <Helmet>
            <title>{pageTitle}</title>
            {pageDescription && <meta name="description" content={pageDescription} />}
            <meta property="og:title" content={pageTitle} />
            {pageDescription && <meta property="og:description" content={pageDescription} />}
        </Helmet>
    );
};

export default SEO;
