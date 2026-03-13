import React from 'react';
import { AppState } from '../types';
import { t, Language } from '../translations';
import { Info } from 'lucide-react';
import { formatUzDateTime } from '../utils';

interface RulesViewProps {
  state: AppState;
  language: Language;
}

const RulesView: React.FC<RulesViewProps> = ({ state, language }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black theme-text uppercase tracking-tight flex items-center gap-3">
          <span className="p-2 bg-brand-gold/10 text-brand-gold rounded-xl">📋</span>
          {t(language, 'rules')}
        </h2>
      </div>

      <div className="space-y-4">
        {state.rules && state.rules.length > 0 ? (
          [...state.rules]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(rule => (
              <div key={rule.id} className="theme-blue-box p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] font-bold theme-text-muted uppercase tracking-wider mt-1.5">
                    {formatUzDateTime(rule.updatedAt)}
                  </div>
                </div>
                <div
                  className="theme-text text-sm leading-relaxed pl-14 [&_a]:text-blue-500 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
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
    </div>
  );
};

export default RulesView;
