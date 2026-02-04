import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StoreSettings } from '@/lib/types';

interface StoreContextType {
    settings: StoreSettings | null;
    loading: boolean;
}

const defaultSettings: StoreSettings = {
    storeName: '',
    description: '',
    whatsappNumber: '',
    courierCharges: 100,
    freeShippingThreshold: 2000,
    gstMessage: 'GST not included',
    logoUrl: '',
};

const StoreContext = createContext<StoreContextType>({
    settings: null,
    loading: true,
});

export const useStore = () => useContext(StoreContext);

interface StoreProviderProps {
    children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
                if (settingsDoc.exists()) {
                    const data = settingsDoc.data();
                    setSettings({
                        storeName: data.storeName || '',
                        description: data.description || '',
                        whatsappNumber: data.whatsappNumber || '',
                        courierCharges: data.courierCharges ?? 100,
                        freeShippingThreshold: data.freeShippingThreshold ?? 2000,
                        gstMessage: data.gstMessage || 'GST not included',
                        logoUrl: data.logoUrl || '',
                    });
                } else {
                    setSettings(defaultSettings);
                }
            } catch (error) {
                console.error('Error fetching store settings:', error);
                setSettings(defaultSettings);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return (
        <StoreContext.Provider value={{ settings, loading }}>
            {children}
        </StoreContext.Provider>
    );
};
