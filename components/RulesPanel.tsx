import React, { useState, useRef, useMemo } from 'react';
import { Rule, AppState } from '../types';
import { t, Language } from '../translations';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { formatUzDateTime } from '../utils';
import { ruleService } from '../api';
import JoditEditor from 'jodit-react';

interface RulesPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  language: Language;
  showNotification: (message: string, type?: 'error' | 'success') => void;
}

const RulesPanel: React.FC<RulesPanelProps> = ({ state, setState, language, showNotification }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<any>(null);

  const handleSave = async () => {
    const currentContent = content;
    if (!currentContent || !currentContent.trim() || currentContent === '<p><br></p>') return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const response = await ruleService.updateRule(editingId, { content: currentContent });
        setState((prev: AppState) => ({
          ...prev,
          rules: prev.rules.map(rule => rule.id === editingId ? response.data : rule)
        }));
        showNotification("Muvaffaqiyatli saqlandi", 'success');
      } else {
        const response = await ruleService.createRule({ content: currentContent });
        setState((prev: AppState) => ({
          ...prev,
          rules: [response.data, ...prev.rules]
        }));
        showNotification("Muvaffaqiyatli qo'shildi", 'success');
      }
      setIsAdding(false);
      setEditingId(null);
      setContent('');
    } catch (err) {
      console.error(err);
      showNotification("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setContent(rule.content);
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setContent('');
  };

  const confirmDelete = async () => {
    if (!deletingRuleId) return;
    setIsSubmitting(true);
    try {
      await ruleService.deleteRule(deletingRuleId);
      setState((prev: AppState) => ({
        ...prev,
        rules: prev.rules.filter(rule => rule.id !== deletingRuleId)
      }));
      setDeletingRuleId(null);
      showNotification("O'chirildi", 'success');
    } catch (error) {
      console.error('Error deleting rule:', error);
      showNotification("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Qoidalarni boying...',
    height: 400,
    theme: 'dark',
    toolbarSticky: false,
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ]
  }), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{t(language, 'rules')}</h2>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">Menejer boshqaruv paneli</p>
          </div>
          {!isAdding && !editingId && (
            <button
              onClick={() => { setIsAdding(true); setContent(''); }}
              className="px-8 py-4 bg-brand-gold text-brand-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-3"
            >
              <Plus className="w-4 h-4" /> YANGI QOIDA
            </button>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="theme-blue-box p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {editingId ? "Tahrirlash" : "Yangi qo'shish"}
              </h3>
              <button onClick={cancelEdit} className="p-2 hover:bg-white/5 rounded-full transition"><X className="w-5 h-5 text-white/40" /></button>
            </div>
            
            <div className="bg-white rounded-2xl overflow-hidden shadow-inner">
              <JoditEditor
                ref={editorRef}
                value={content}
                config={config}
                onBlur={newContent => setContent(newContent)}
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
              <button
                onClick={cancelEdit}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting || !content.trim() || content === '<p><br></p>'}
                className="px-10 py-4 bg-brand-gold text-brand-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-gold/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {state.rules && state.rules.length > 0 ? (
            [...state.rules]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(rule => (
                <div key={rule.id} className="theme-blue-box p-8 rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-brand-gold/30 transition-all duration-500 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-brand-gold/10 transition-all"></div>
                  <div className="flex items-start justify-between gap-6 mb-6 relative z-10">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                      {formatUzDateTime(rule.updatedAt)}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-3 bg-white/5 text-white/40 hover:text-brand-gold hover:bg-brand-gold/10 rounded-xl transition-all border border-transparent hover:border-brand-gold/30"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingRuleId(rule.id)}
                        className="p-3 bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-white/80 leading-relaxed font-medium relative z-10 rule-content" dangerouslySetInnerHTML={{ __html: rule.content }} />
                </div>
              ))
          ) : (
            <div className="py-20 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl opacity-20">📋</div>
              <p className="text-white/20 font-black uppercase tracking-widest text-[10px]">Qoidalar mavjud emas</p>
            </div>
          )}
        </div>
      </div>

      {deletingRuleId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-brand-dark rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
             <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
                <Trash2 className="w-8 h-8" />
             </div>
            <h3 className="text-xl font-black text-white text-center uppercase tracking-tight mb-2">O'chirishni tasdiqlang</h3>
            <p className="text-white/40 text-center text-sm font-medium mb-8 leading-relaxed">Ushbu qoida butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeletingRuleId(null)} 
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
              >
                Bekor qilish
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPanel;
