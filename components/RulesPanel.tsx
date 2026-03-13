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
}

const RulesPanel: React.FC<RulesPanelProps> = ({ state, setState, language }) => {
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
        const res = await ruleService.updateRule(editingId, { content: currentContent });
        setState(prev => ({
          ...prev,
          rules: prev.rules.map(rule =>
            rule.id === editingId
              ? res.data
              : rule
          )
        }));
      } else {
        const res = await ruleService.createRule({ content: currentContent });
        setState(prev => ({
          ...prev,
          rules: [res.data, ...(prev.rules || [])]
        }));
      }
      setIsAdding(false);
      setEditingId(null);
      setContent('');
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Qoidani saqlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setContent(rule.content);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setDeletingRuleId(id);
  };

  const confirmDelete = async () => {
    if (deletingRuleId) {
      setIsSubmitting(true);
      try {
        await ruleService.deleteRule(deletingRuleId);
        setState(prev => ({
          ...prev,
          rules: prev.rules.filter(rule => rule.id !== deletingRuleId)
        }));
        setDeletingRuleId(null);
      } catch (error) {
        console.error('Error deleting rule:', error);
        alert("Qoidani o'chirishda xatolik yuz berdi");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setContent('');
  };

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Qoida matnini kiriting...',
    height: 400,
    theme: 'default',
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black theme-text uppercase tracking-tight flex items-center gap-3">
          <span className="p-2 bg-brand-gold/10 text-brand-gold rounded-xl">📋</span>
          {t(language, 'rules')}
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-black rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-brand-gold/20 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            Yangi qoida
          </button>
        )}
      </div>

      {isAdding && (
        <div className="theme-blue-box p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="bg-white rounded-xl overflow-hidden text-black">
            <JoditEditor
              ref={editorRef}
              value={content}
              config={config}
              onBlur={newContent => setContent(newContent)}
              onChange={newContent => { }}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 theme-text rounded-xl font-black text-xs hover:bg-black/10 dark:hover:bg-white/10 transition-all uppercase tracking-wider"
            >
              <X className="w-4 h-4" />
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-black rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-brand-gold/20 uppercase tracking-wider disabled:opacity-50 disabled:hover:scale-100"
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
              <div key={rule.id} className="theme-blue-box p-6 rounded-2xl border border-white/10 shadow-lg group">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="text-[10px] font-bold theme-text-muted uppercase tracking-wider">
                    {formatUzDateTime(rule.updatedAt)}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 bg-black/5 dark:bg-white/5 text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 bg-black/5 dark:bg-white/5 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  className="theme-text text-sm leading-relaxed prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: rule.content }}
                />
              </div>
            ))
        ) : (
          <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 border-dashed">
            <p className="text-sm font-bold theme-text-muted uppercase tracking-wider">Hozircha qoidalar kiritilmagan</p>
          </div>
        )}
      </div>

      {deletingRuleId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeletingRuleId(null)}></div>
          <div className="bg-brand-dark w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Qoidani o'chirish
            </h3>
            <p className="text-white/60 text-sm mb-8">
              Haqiqatan ham ushbu qoidani o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeletingRuleId(null)}
                className="flex-1 py-4 rounded-2xl font-black text-white/60 uppercase tracking-widest hover:bg-white/5 transition border border-white/10"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-2xl font-black text-white uppercase tracking-widest bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isSubmitting ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPanel;
