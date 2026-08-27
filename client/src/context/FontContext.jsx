import React, { createContext, useState, useEffect, useContext } from 'react';

export const FontContext = createContext();

export const FONTS = [
  { id: 'Inter', name: 'Inter', family: "'Inter', sans-serif", link: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' },
  { id: 'Jakarta', name: 'Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", link: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' },
  { id: 'Outfit', name: 'Outfit', family: "'Outfit', sans-serif", link: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap' },
  { id: 'Space', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", link: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' },
];

export const FontProvider = ({ children }) => {
  const [currentFont, setCurrentFont] = useState(() => {
    return localStorage.getItem('workradar_font') || 'Inter';
  });

  const changeFont = (fontId) => {
    setCurrentFont(fontId);
    localStorage.setItem('workradar_font', fontId);
  };

  useEffect(() => {
    const selected = FONTS.find((f) => f.id === currentFont) || FONTS[0];

    // Check if link already loaded
    let linkElement = document.getElementById('workradar-custom-font');
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = 'workradar-custom-font';
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }
    linkElement.href = selected.link;

    // Apply font family to document body and root
    document.body.style.fontFamily = selected.family;
  }, [currentFont]);

  return (
    <FontContext.Provider value={{ currentFont, changeFont, FONTS }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};
