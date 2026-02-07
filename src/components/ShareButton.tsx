import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

// Social media icons as SVG components
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const TwitterIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const SmsIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

interface ShareButtonProps {
    productName: string;
    productUrl?: string;
}

const ShareButton = ({ productName, productUrl }: ShareButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const shareUrl = productUrl || window.location.href;
    const shareText = `Check out ${productName}!`;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const handleWhatsAppShare = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
        window.open(whatsappUrl, '_blank');
        setIsOpen(false);
    };

    const handleFacebookShare = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
    };

    const handleTwitterShare = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
    };

    const handleSmsShare = () => {
        // Works on mobile devices
        const smsUrl = `sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        window.location.href = smsUrl;
        setIsOpen(false);
    };

    const shareOptions = [
        { icon: copied ? Check : Copy, label: copied ? 'Copied!' : 'Copy Link', onClick: handleCopyLink, className: copied ? 'text-green-600' : '' },
        { icon: WhatsAppIcon, label: 'WhatsApp', onClick: handleWhatsAppShare, className: 'text-green-600' },
        { icon: FacebookIcon, label: 'Facebook', onClick: handleFacebookShare, className: 'text-blue-600' },
        { icon: TwitterIcon, label: 'Twitter/X', onClick: handleTwitterShare, className: '' },
        { icon: SmsIcon, label: 'SMS', onClick: handleSmsShare, className: 'text-blue-500' },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
                title="Share product"
            >
                <Share2 className="h-4 w-4" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-border/50 bg-secondary/30">
                        <p className="text-xs font-medium text-muted-foreground">Share this product</p>
                    </div>
                    <div className="py-1">
                        {shareOptions.map((option) => (
                            <button
                                key={option.label}
                                onClick={option.onClick}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors ${option.className}`}
                            >
                                <option.icon />
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShareButton;
