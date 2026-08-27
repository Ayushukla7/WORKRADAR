import React, { useState } from 'react';
import { useFont } from '../../context/FontContext';
import { Type, ChevronDown, Check } from 'lucide-react';

const FontSwitcher = () => {
  const { currentFont, changeFont, FONTS } = useFont();
  const [open, setOpen] = useState(false);

  const activeFontObj = FONTS.find((f) => f.id === currentFont) || FONTS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 rounded-full border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition shadow-2xs"
        title="Change Typography Font"
      >
        <Type className="w-3.5 h-3.5 text-indigo-600" />
        <span className="hidden sm:inline font-mono">{activeFontObj.name}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white/95 border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 backdrop-blur-xl">
          <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            Font Family
          </div>
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => {
                changeFont(font.id);
                setOpen(false);
              }}
              style={{ fontFamily: font.family }}
              className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between font-medium transition ${
                currentFont === font.id
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{font.name}</span>
              {currentFont === font.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FontSwitcher;
