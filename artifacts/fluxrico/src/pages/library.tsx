import { FileText, FolderOpen, Lightbulb, Plus, Quote } from 'lucide-react';
import { useState } from 'react';
import { AppShell, PageHeader } from '@/components/app-shell';
import { LIBRARY_ENTRIES } from '@/lib/journey';
import type { LibraryEntry } from '@/lib/journey';

const KIND_ICON: Record<LibraryEntry['kind'], typeof FileText> = {
  Idea: Lightbulb,
  Note: FileText,
  Prompt: Quote,
};

const KIND_STYLE: Record<LibraryEntry['kind'], string> = {
  Idea: 'bg-[#F0EFFF] text-[#6256DB]',
  Note: 'bg-[#E4F9FC] text-[#159BB5]',
  Prompt: 'bg-[#FDF3E7] text-[#B0651F]',
};

export default function Library() {
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const savedCount = Object.values(saved).filter(Boolean).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px]">
        <PageHeader
          eyebrow="Library / your pieces"
          title="A quiet place for your useful pieces."
          description="Ideas, notes, and prompts stop living in your head once they have a place to rest."
        />

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-[#D5D6E8] bg-[#FAFAFE] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <p className="max-w-[36rem] text-sm leading-6 text-[#6E7192]">Saving works locally in this preview. In a later phase your library will follow you across sessions.</p>
          <button
            type="button"
            onClick={() => setSaved(Object.fromEntries(LIBRARY_ENTRIES.map((entry) => [entry.id, true])))}
            disabled={savedCount === LIBRARY_ENTRIES.length}
            className="fluxrico-focus inline-flex min-h-10 items-center gap-2 rounded-full bg-[#211F61] px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-white transition-colors hover:bg-[#35318A] disabled:cursor-not-allowed disabled:bg-[#BFC0D3] disabled:hover:bg-[#BFC0D3]"
            data-testid="button-library-new"
          >
            <Plus size={15} strokeWidth={2.2} /> Save all pieces
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LIBRARY_ENTRIES.map((entry) => {
            const Icon = KIND_ICON[entry.kind];
            const isSaved = !!saved[entry.id];
            return (
              <article
                key={entry.id}
                className="dashboard-card-lift flex flex-col rounded-[1.4rem] border border-[#DADBF0] bg-white p-5 shadow-[0_8px_28px_rgba(44,42,123,0.04)]"
                data-testid={`card-library-${entry.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.13em] ${KIND_STYLE[entry.kind]}`}>
                    <Icon size={13} strokeWidth={2} /> {entry.kind}
                  </span>
                  <time className="text-[0.64rem] font-medium text-[#9A9CB3]">{entry.date}</time>
                </div>
                <h2 className="mt-5 text-lg font-extrabold leading-snug tracking-[-0.03em] text-[#25265A]">{entry.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#747696]">{entry.excerpt}</p>
                <div className="mt-5 border-t border-[#ECECF1] pt-4">
                  <button
                    type="button"
                    onClick={() => setSaved((current) => ({ ...current, [entry.id]: !current[entry.id] }))}
                    aria-pressed={isSaved}
                    className={`fluxrico-focus inline-flex min-h-9 items-center rounded-full border px-3.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition-colors ${
                      isSaved
                        ? 'border-[#6256DB] bg-[#F0EFFF] text-[#5147C2]'
                        : 'border-[#D4D5E8] bg-white text-[#5B56B5] hover:border-[#8E88E1]'
                    }`}
                    data-testid={`button-library-save-${entry.id}`}
                  >
                    {isSaved ? 'Saved' : 'Save to journey'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[#DDDEEC] pt-5 sm:flex-row sm:items-center">
          <p className="max-w-[33rem] text-xs leading-5 text-[#888AA4]">Three starter pieces are here to show the shape of the library.{savedCount > 0 && ` ${savedCount} saved to your journey.`}</p>
          <span className="inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">
            <FolderOpen size={14} strokeWidth={1.8} /> {LIBRARY_ENTRIES.length} pieces
          </span>
        </div>
      </div>
    </AppShell>
  );
}
