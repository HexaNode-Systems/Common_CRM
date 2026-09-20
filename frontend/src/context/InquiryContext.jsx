import { createContext, useContext, useState, useCallback } from 'react';

const InquiryContext = createContext({
  isOpen: false,
  ctaSource: '',
  openInquiryModal: () => {},
  closeInquiryModal: () => {},
});

export function InquiryProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ctaSource, setCtaSource] = useState('general');

  const openInquiryModal = useCallback((source = 'general') => {
    const src = typeof source === 'string' ? source : (source?.ctaSource || 'general');
    setCtaSource(src);
    setIsOpen(true);
  }, []);

  const closeInquiryModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <InquiryContext.Provider value={{ isOpen, ctaSource, openInquiryModal, closeInquiryModal }}>
      {children}
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  const context = useContext(InquiryContext);
  if (!context) {
    return {
      isOpen: false,
      ctaSource: '',
      openInquiryModal: () => {},
      closeInquiryModal: () => {},
    };
  }
  return context;
}
