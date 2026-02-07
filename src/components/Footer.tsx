import { useStore } from '@/contexts/StoreContext';
import { MapPin, Phone, Mail } from 'lucide-react';

// Format WhatsApp number (919876543210) to display format (+91 98765 43210)
const formatPhoneNumber = (number: string): string => {
  if (!number) return '';

  // If it starts with country code (assuming 2-3 digits), format nicely
  if (number.length >= 10) {
    // Extract country code (first 2 digits for most countries)
    const countryCode = number.slice(0, 2);
    const rest = number.slice(2);

    // Format the rest in groups
    const formatted = rest.replace(/(\d{5})(\d{5})/, '$1 $2');
    return `+${countryCode} ${formatted}`;
  }

  return number;
};

const Footer = () => {
  const { settings } = useStore();

  const hasContactInfo = settings?.storeAddress || settings?.whatsappNumber || settings?.storeEmail;

  return (
    <footer className="w-full border-t bg-secondary/60 py-8 mt-auto">
      <div className="container mx-auto px-4">
        {hasContactInfo && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Visit Us Section */}
            {settings?.storeAddress && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Visit Us
                </h3>
                <p className="text-foreground/70 text-sm whitespace-pre-wrap pl-6">
                  {settings.storeAddress}
                </p>
              </div>
            )}

            {/* Contact Us Section */}
            {(settings?.whatsappNumber || settings?.storeEmail) && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent" />
                  Contact Us
                </h3>
                <div className="space-y-2 pl-6">
                  {settings?.whatsappNumber && (
                    <a
                      href={`tel:+${settings.whatsappNumber}`}
                      className="text-foreground/70 text-sm hover:text-accent transition-colors flex items-center gap-2"
                    >
                      <Phone className="h-3 w-3" />
                      {formatPhoneNumber(settings.whatsappNumber)}
                    </a>
                  )}
                  {settings?.storeEmail && (
                    <a
                      href={`mailto:${settings.storeEmail}`}
                      className="text-foreground/70 text-sm hover:text-accent transition-colors flex items-center gap-2"
                    >
                      <Mail className="h-3 w-3" />
                      {settings.storeEmail}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credits */}
        <div className={`text-center ${hasContactInfo ? 'pt-6 border-t border-border/50' : ''}`}>
          <p className="text-foreground/70 text-sm">
            Crafted with care by{' '}
            <span className="font-semibold text-foreground">
              <a href="https://innovarc.uk/" className="hover:text-accent transition-colors">
                Innovative Archive
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
