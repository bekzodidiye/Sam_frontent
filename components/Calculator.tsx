
import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Minus, Plus, Divide, Hash, Delete, Percent, Move } from 'lucide-react';
import { t, Language } from '../translations';

interface CalculatorProps {
  onClose: () => void;
  language: Language;
  isDarkMode: boolean;
}

const formatNumber = (num: string) => {
  return num.replace(/(\d+)/g, (match) => {
    return match.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  });
};
const getFontSize = (text: string) => {
  const len = text.length;
  if (len <= 9) return '2.5rem';
  if (len <= 13) return '2rem';
  if (len <= 18) return '1.5rem';
  if (len <= 24) return '1.2rem';
  if (len <= 32) return '1rem';
  return '0.8rem';
};

const Calculator: React.FC<CalculatorProps> = ({ onClose, language, isDarkMode }) => {
  const [expression, setExpression] = useState('');
  const [width, setWidth] = useState(450);
  const dragControls = useDragControls();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<{ pos: number; val: string } | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (pendingCursorRef.current && inputRef.current) {
      const { pos, val } = pendingCursorRef.current;
      const newVal = formatNumber(expression) || '0';
      
      let nonSpaceCount = 0;
      for (let i = 0; i < pos; i++) {
        if (val[i] !== ' ') nonSpaceCount++;
      }
      
      let newPos = 0;
      let currentNonSpaceCount = 0;
      while (newPos < newVal.length && currentNonSpaceCount < nonSpaceCount) {
        if (newVal[newPos] !== ' ') currentNonSpaceCount++;
        newPos++;
      }
      
      while (newPos < newVal.length && newVal[newPos] === ' ') {
        newPos++;
      }
      
      inputRef.current.setSelectionRange(newPos, newPos);
      pendingCursorRef.current = null;
    }
  }, [expression]);

  const buttonPadding = 'p-5';
  const buttonTextSize = 'text-2xl';
  const iconSize = 'w-7 h-7';
  const clear = () => setExpression('');
  const handleDelete = () => setExpression(expression.length > 0 ? expression.slice(0, -1) : '');
  const handlePercent = () => {
    if (!expression || expression === 'Error') return;
    try {
      const val = eval(expression);
      setExpression((val / 100).toString());
    } catch (e) {}
  };
  const handleOperator = (op: string) => {
    if (expression === 'Error') return;
    if (expression === '') {
      if (op === '-') setExpression('-');
      return;
    }
    const lastChar = expression.slice(-1);
    if (['+', '-', '*', '/', '.'].includes(lastChar)) {
      setExpression(expression.slice(0, -1) + op);
    } else {
      setExpression(expression + op);
    }
  };
  const handleNumber = (num: string) => {
    if (expression === 'Error') {
      setExpression(num === '.' ? '0.' : num);
      return;
    }
    // Prevent multiple dots in a single number
    if (num === '.' && expression.split(/[+\-*/]/).pop()?.includes('.')) return;
    
    if ((expression === '0' || expression === '') && num !== '.') {
      setExpression(num);
    } else {
      setExpression(expression + num);
    }
  };
  const calculate = () => {
    if (!expression || expression === 'Error') return;
    // Don't calculate if it ends with an operator
    if (['+', '-', '*', '/', '.'].includes(expression.slice(-1))) return;
    
    try {
      const result = eval(expression);
      if (result === Infinity || isNaN(result)) {
        setExpression('Error');
      } else {
        setExpression(result.toString());
      }
    } catch (e) {
      // Silent fail as requested "error chiqmasin"
    }
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragListener={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      style={{ width: `${width}px`, maxWidth: 'calc(100vw - 2rem)' }}
      className={`fixed top-20 right-2 left-2 sm:right-8 sm:left-auto z-[2000] backdrop-blur-xl border rounded-[2rem] shadow-2xl flex flex-col ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-gray-200'}`}
    >
      <div 
        className={`p-3 sm:p-4 bg-brand-gold/10 border-b flex items-center justify-between cursor-move shrink-0 ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-6 h-6 bg-brand-gold/20 rounded-lg flex items-center justify-center">
            <Move className="w-3 h-3 text-brand-gold" />
          </div>
          <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{t(language, 'calculator')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-brand-gold' : 'hover:bg-gray-100 text-gray-400 hover:text-brand-gold'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6 flex-1 flex flex-col">
        <div 
          className={`mb-2 sm:mb-6 text-right p-4 sm:p-6 rounded-2xl border overflow-y-auto shrink-0 flex items-center justify-end min-h-[120px] sm:min-h-[160px] max-h-[180px] sm:max-h-[220px] relative cursor-text ${isDarkMode ? 'bg-zinc-800 border-white/10' : 'bg-gray-100 border-gray-200'}`}
          onClick={() => inputRef.current?.focus()}
        >
          <textarea
            ref={inputRef}
            value={formatNumber(expression)}
            placeholder="0"
            onChange={(e) => {
              const textarea = e.target;
              const pos = textarea.selectionStart;
              const val = textarea.value;
              let value = val.replace(/\s/g, '');
              // Prevent consecutive operators
              value = value.replace(/([+\-*/.])([+\-*/.]+)/g, '$1');
              // Allow only numbers, operators, and decimal point
              if (/^[0-9+\-*/.]*$/.test(value)) {
                setExpression(value);
                pendingCursorRef.current = { pos, val };
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                calculate();
              }
              if (e.key === 'Escape') {
                clear();
              }
            }}
            className={`font-black tracking-tighter font-mono transition-all duration-200 break-all w-full text-right bg-transparent outline-none resize-none ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-gray-900 placeholder:text-black/20'}`}
            style={{ 
              fontSize: getFontSize(formatNumber(expression) || '0'),
              lineHeight: '1.1',
              height: '100%',
            }}
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1">
          <button onClick={clear} className={`col-span-2 p-3 sm:p-5 bg-red-500/10 text-red-500 rounded-2xl font-black text-xl sm:text-2xl hover:bg-red-500/20 transition-all uppercase cursor-pointer flex items-center justify-center`}>C</button>
          <button onClick={handleDelete} className={`p-3 sm:p-5 rounded-2xl font-black transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-white/80 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Delete className="w-5 h-5 sm:w-7 sm:h-7" /></button>
          <button onClick={handlePercent} className={`p-3 sm:p-5 rounded-2xl font-black transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-brand-gold hover:bg-zinc-700' : 'bg-gray-100 text-brand-gold hover:bg-gray-200'}`}><Percent className="w-5 h-5 sm:w-7 sm:h-7" /></button>

          {[7, 8, 9].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className={`p-3 sm:p-5 rounded-2xl font-black text-xl sm:text-2xl transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>{n}</button>
          ))}
          <button onClick={() => handleOperator('/')} className={`p-3 sm:p-5 rounded-2xl font-black transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-brand-gold hover:bg-zinc-700' : 'bg-gray-100 text-brand-gold hover:bg-gray-200'}`}><Divide className="w-5 h-5 sm:w-7 sm:h-7" /></button>

          {[4, 5, 6].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className={`p-3 sm:p-5 rounded-2xl font-black text-xl sm:text-2xl transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>{n}</button>
          ))}
          <button onClick={() => handleOperator('*')} className={`p-3 sm:p-5 rounded-2xl font-black transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-brand-gold hover:bg-zinc-700' : 'bg-gray-100 text-brand-gold hover:bg-gray-200'}`}><X className="w-5 h-5 sm:w-7 sm:h-7" /></button>

          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className={`p-3 sm:p-5 rounded-2xl font-black text-xl sm:text-2xl transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>{n}</button>
          ))}
          <button onClick={() => handleOperator('-')} className={`p-3 sm:p-5 rounded-2xl font-black transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-brand-gold hover:bg-zinc-700' : 'bg-gray-100 text-brand-gold hover:bg-gray-200'}`}><Minus className="w-5 h-5 sm:w-7 sm:h-7" /></button>

          <button onClick={() => handleNumber('0')} className={`col-span-2 p-3 sm:p-5 rounded-2xl font-black text-xl sm:text-2xl transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>0</button>
          <button onClick={() => handleNumber('.')} className={`p-3 sm:p-5 rounded-2xl font-black text-xl sm:text-2xl transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>.</button>
          <button onClick={() => handleOperator('+')} className={`p-3 sm:p-5 rounded-2xl font-black transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-brand-gold hover:bg-zinc-700' : 'bg-gray-100 text-brand-gold hover:bg-gray-200'}`}><Plus className="w-5 h-5 sm:w-7 sm:h-7" /></button>

          <button onClick={calculate} className={`col-span-4 p-3 sm:p-5 bg-brand-gold text-brand-black rounded-2xl font-black text-xl sm:text-2xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center`}>=</button>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-2 text-white/30 hover:text-brand-gold transition-colors z-50"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startWidth = width;
          
          const handlePointerMove = (moveEvent: PointerEvent) => {
            const newWidth = Math.max(250, Math.min(800, startWidth + (moveEvent.clientX - startX)));
            setWidth(newWidth);
          };
          
          const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            document.body.style.cursor = '';
          };
          
          document.body.style.cursor = 'se-resize';
          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', handlePointerUp);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12H9L12 9V12ZM12 7H9L12 4V7ZM7 12H4L7 9V12Z" fill="currentColor"/>
        </svg>
      </div>
    </motion.div>
  );
};

export default Calculator;
