import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  FileText,
  Lightbulb,
  Library as LibraryIcon,
  Package,
  Plus,
  Route as RouteIcon,
  Search,
  Star,
  X,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'wouter';
import { AppShell, PageHeader } from '@/components/app-shell';
import { useJourney } from '@/hooks/use-journey';
import { LIBRARY_ENTRIES, ROADMAP_STAGES, getStageIndex } from '@/lib/journey';
import type { LibraryEntry, LibraryEntryKind, RoadmapStageName } from '@/lib/journey';
import { useWorkspaceState } from '@/lib/workspace-state';

// ── Library vocabulary ───────────────────────────────────────────────────────
// Categories, kinds, and stage rendering all read from the shared journey
// source in lib/journey.ts — nothing journey-related is redefined here.

type CategoryKey = 'all' | 'ideas' | 'notes' | 'saved' | 'resources' | 'outputs';

const CATEGORIES: { key: CategoryKey; label: string; matches: (entry: LibraryEntry) => boolean }[] = [
  { key: 'all', label: 'All', matches: () => true },
  { key: 'ideas', label: 'Ideas', matches: (entry) => entry.kind === 'Idea' },
  { key: 'notes', label: 'Notes', matches: (entry) => entry.kind === 'Note' },
  { key: 'saved', label: 'Saved', matches: (entry) => entry.saved === true },
  { key: 'resources', label: 'Resources', matches: (entry) => entry.kind === 'Resource' },
  { key: 'outputs', label: 'Outputs', matches: (entry) => entry.kind === 'Output' },
];

const KIND_META: Record<LibraryEntryKind, { icon: typeof Lightbulb; badge: string }> = {
  Idea: { icon: Lightbulb, badge: 'bg-[#F0EFFF] text-[#6256DB]' },
  Note: { icon: FileText, badge: 'bg-[#E4F9FC] text-[#159BB5]' },
  Resource: { icon: Bookmark, badge: 'bg-[#FDF3E7] text-[#B0651F]' },
  Output: { icon: Package, badge: 'bg-[#F1F2FD] text-[#4E46C0]' },
};

// ── Small shared pieces ──────────────────────────────────────────────────────

function KindBadge({ kind }: { kind: LibraryEntryKind }) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.13em] ${meta.badge}`}>
      <Icon size={13} strokeWidth={2} /> {kind}
    </span>
  );
}

function StageChip({ stage, currentStage }: { stage: RoadmapStageName; currentStage: RoadmapStageName }) {
  const info = ROADMAP_STAGES[getStageIndex(stage)];
  const isCurrent = stage === currentStage;
  return (
    <Link
      href={`/roadmap?stage=${stage}`}
      className={`fluxrico-focus inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-[0.6rem] font-bold uppercase tracking-[0.11em] transition-colors ${
        isCurrent ? 'bg-[#E0F9FC] text-[#168BA5] hover:bg-[#D2F3F9]' : 'bg-[#F1F2FD] text-[#4E46C0] hover:bg-[#E9EAFB]'
      }`}
      data-testid={`link-library-stage-${stage.toLowerCase()}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-[#16C6EA]' : 'bg-[#8B84E8]'}`} aria-hidden="true" />
      {info.number} · {stage}
      {isCurrent && <span className="sr-only">(current stage)</span>}
    </Link>
  );
}

function SaveStar({ entry, onToggleSave }: { entry: LibraryEntry; onToggleSave: (id: string) => void }) {
  const saved = entry.saved === true;
  return (
    <button
      type="button"
      onClick={() => onToggleSave(entry.id)}
      aria-pressed={saved}
      aria-label={saved ? `Remove “${entry.title}” from saved` : `Save “${entry.title}”`}
      className={`fluxrico-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
        saved ? 'text-[#C77E1B] hover:bg-[#FBF4E7]' : 'text-[#A0A2B7] hover:bg-[#F4F4FB] hover:text-[#686B8D]'
      }`}
      data-testid={`button-library-save-${entry.id}`}
    >
      <Star size={18} strokeWidth={1.8} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Search; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mt-6 rounded-[1.8rem] border border-dashed border-[#D5D6E8] bg-[#FAFAFE] px-6 py-14 text-center" data-testid="state-library-empty">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8B8DAB] shadow-sm">
        <Icon size={20} strokeWidth={1.6} />
      </span>
      <h2 className="mt-5 text-xl font-extrabold tracking-[-0.04em] text-[#25265A]">{title}</h2>
      <p className="mx-auto mt-2 max-w-[27rem] text-sm leading-6 text-[#8587A3]">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

const QUIET_BUTTON =
  'fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D4D5E8] bg-white px-4 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-[#5B56B5] transition-colors hover:border-[#8E88E1]';

// ── Card ─────────────────────────────────────────────────────────────────────

function LibraryCard({
  entry,
  currentStage,
  onOpen,
  onToggleSave,
}: {
  entry: LibraryEntry;
  currentStage: RoadmapStageName;
  onOpen: (id: string) => void;
  onToggleSave: (id: string) => void;
}) {
  return (
    <article
      className="dashboard-card-lift flex flex-col rounded-[1.4rem] border border-[#DADBF0] bg-white p-5 shadow-[0_8px_28px_rgba(44,42,123,0.04)]"
      data-testid={`card-library-${entry.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <KindBadge kind={entry.kind} />
        <SaveStar entry={entry} onToggleSave={onToggleSave} />
      </div>
      <button
        type="button"
        onClick={() => onOpen(entry.id)}
        className="fluxrico-focus group mt-1 flex-1 rounded-lg text-left"
        aria-label={`Open “${entry.title}”`}
        data-testid={`button-library-open-${entry.id}`}
      >
        <h2 className="text-lg font-extrabold leading-snug tracking-[-0.03em] text-[#25265A] transition-colors group-hover:text-[#5147C2]">
          {entry.title}
        </h2>
        {entry.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#747696]">{entry.excerpt}</p>}
      </button>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#ECECF1] pt-4">
        {entry.stage ? (
          <StageChip stage={entry.stage} currentStage={currentStage} />
        ) : (
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#A0A2B7]">No stage link</span>
        )}
        <time className="text-[0.64rem] font-medium text-[#9A9CB3]">{entry.date}</time>
      </div>
    </article>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function LibraryDetail({
  entry,
  currentStage,
  onBack,
  onToggleSave,
  onRemove,
}: {
  entry: LibraryEntry;
  currentStage: RoadmapStageName;
  onBack: () => void;
  onToggleSave: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const stageInfo = entry.stage ? ROADMAP_STAGES[getStageIndex(entry.stage)] : null;
  const saved = entry.saved === true;

  return (
    <section
      className="fluxrico-rise rounded-[1.65rem] border border-[#DCDDED] bg-white p-6 shadow-[0_14px_36px_rgba(44,42,123,0.055)] sm:p-8"
      aria-labelledby="library-detail-title"
      data-testid="panel-library-detail"
    >
      <button
        type="button"
        onClick={onBack}
        className={`${QUIET_BUTTON} -ml-1`}
        data-testid="button-library-back"
      >
        <ArrowLeft size={15} strokeWidth={2} /> Back to library
      </button>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <KindBadge kind={entry.kind} />
        {entry.sample && (
          <span className="rounded-full border border-[#E0E1F0] bg-[#FAFAFE] px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.13em] text-[#8A8CAD]">
            Sample piece
          </span>
        )}
        <time className="ml-auto text-[0.66rem] font-medium text-[#9A9CB3]">{entry.date}</time>
      </div>

      <h2 id="library-detail-title" className="mt-4 max-w-[34rem] text-[1.9rem] font-extrabold leading-[1.08] tracking-[-0.055em] text-[#202155] sm:text-[2.2rem]">
        {entry.title}
      </h2>
      {entry.excerpt && <p className="mt-4 max-w-[36rem] text-base leading-7 text-[#565980]">{entry.excerpt}</p>}

      {/* Journey connection: every piece points back to the stage it belongs to. */}
      <div className="mt-8 border-t border-[#ECECF1] pt-6">
        <p className="text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#6861C8]">Journey connection</p>
        {stageInfo ? (
          <div className="mt-4 rounded-2xl border border-[#E4E4F4] bg-[#FAFAFE] p-5">
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-extrabold ${
                  entry.stage === currentStage ? 'border-[#16C5E9] bg-[#E0F9FC] text-[#168BA5]' : 'border-[#D8D9E9] bg-white text-[#6256DB]'
                }`}
                aria-hidden="true"
              >
                {stageInfo.number}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold tracking-[-0.02em] text-[#25265A]">
                  {stageInfo.name}
                  {entry.stage === currentStage && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E0F9FC] px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#168BA5]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16C6EA]" aria-hidden="true" /> Current stage
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#727596]">{stageInfo.description}</p>
              </div>
            </div>
            <Link
              href={`/roadmap?stage=${stageInfo.name}`}
              className="fluxrico-focus mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#EBE9FF] px-4 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#5147C2] transition-colors hover:bg-[#E1DEFF]"
              data-testid="link-library-detail-roadmap"
            >
              Open {stageInfo.name} in Roadmap <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[#D5D6E8] bg-[#FAFAFE] p-5">
            <p className="text-sm font-bold text-[#343568]">Not connected to a stage yet.</p>
            <p className="mt-1.5 text-sm leading-6 text-[#8587A3]">
              This piece stands on its own. Journey links can be added when you file it — connections stay useful, never forced.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#ECECF1] pt-6">
        <button
          type="button"
          onClick={() => onToggleSave(entry.id)}
          aria-pressed={saved}
          className={`fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.63rem] font-bold uppercase tracking-[0.13em] transition-colors ${
            saved ? 'bg-[#FBF4E7] text-[#9A6414] hover:bg-[#F7ECD7]' : 'bg-[#EBE9FF] text-[#5147C2] hover:bg-[#E1DEFF]'
          }`}
          data-testid="button-library-detail-save"
        >
          <Star size={15} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save this piece'}
        </button>
        {entry.sample && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className={`${QUIET_BUTTON} text-[#A05B5B] hover:border-[#C98B8B]`}
            data-testid="button-library-detail-remove"
          >
            <X size={14} strokeWidth={2} /> Remove sample piece
          </button>
        )}
      </div>
    </section>
  );
}

// ── Add flow ─────────────────────────────────────────────────────────────────

type NewPieceDraft = {
  title: string;
  kind: LibraryEntryKind;
  stage?: RoadmapStageName;
  excerpt: string;
};

function AddItemForm({ onAdd, onCancel }: { onAdd: (draft: NewPieceDraft) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<LibraryEntryKind>('Idea');
  const [stage, setStage] = useState<RoadmapStageName | ''>('');
  const [excerpt, setExcerpt] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onAdd({ title: cleanTitle, kind, excerpt: excerpt.trim(), stage: stage || undefined });
  };
  const fieldClass =
    'fluxrico-focus mt-2 w-full rounded-xl border border-[#DADBEA] bg-[#FAFAFE] px-4 py-3 text-sm font-semibold text-[#25265A] outline-none transition-colors placeholder:font-medium placeholder:text-[#A0A2B7] focus:border-[#AAA5E5] focus:bg-white';

  return (
    <form
      onSubmit={submit}
      className="fluxrico-rise mt-6 rounded-[1.65rem] border border-[#DCDDED] bg-white p-6 shadow-[0_14px_36px_rgba(44,42,123,0.055)] sm:p-8"
      aria-labelledby="library-add-title"
      data-testid="form-library-add"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="library-add-title" className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#6258D0]">Add a piece</h2>
          <p className="mt-2 text-sm leading-6 text-[#747696]">A title is enough to start — details can wait until the piece earns them.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel adding a piece"
          className="fluxrico-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#8A8CAD] transition-colors hover:bg-[#F4F4FB] hover:text-[#383777]"
          data-testid="button-library-add-cancel"
        >
          <X size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What is this piece about?"
            autoFocus
            className={fieldClass}
            data-testid="input-library-add-title"
          />
        </label>
        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Kind</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as LibraryEntryKind)}
            className={fieldClass}
            data-testid="select-library-add-kind"
          >
            <option value="Idea">Idea</option>
            <option value="Note">Note</option>
            <option value="Resource">Resource</option>
          </select>
          <span className="mt-2 block text-xs leading-5 text-[#9A9CB3]">Outputs are collected automatically in a later phase.</span>
        </label>
        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">Journey stage</span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value as RoadmapStageName | '')}
            className={fieldClass}
            data-testid="select-library-add-stage"
          >
            <option value="">Not connected yet</option>
            {ROADMAP_STAGES.map((info) => (
              <option key={info.name} value={info.name}>
                {info.number} · {info.name}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs leading-5 text-[#9A9CB3]">Optional — connect the piece where it belongs.</span>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8587A3]">The piece itself</span>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={3}
            placeholder="A few honest sentences. What should future-you remember?"
            className={`${fieldClass} resize-none leading-6`}
            data-testid="input-library-add-excerpt"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#ECECF1] pt-5">
        <button
          type="submit"
          disabled={!title.trim()}
          className="fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full bg-[#211F61] px-5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#35318A] disabled:cursor-not-allowed disabled:bg-[#BFC0D3] disabled:hover:bg-[#BFC0D3]"
          data-testid="button-library-add-submit"
        >
          Add to Library <ArrowRight size={14} strokeWidth={2.2} />
        </button>
        <button type="button" onClick={onCancel} className={QUIET_BUTTON} data-testid="button-library-add-dismiss">
          Cancel
        </button>
        <p className="text-xs leading-5 text-[#9A9CB3]">Pieces live in this session for now — saving across visits arrives with accounts.</p>
      </div>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Library() {
  const journey = useJourney();
  const { recordLibraryPieceAdded, recordLibraryPieceSaved } = useWorkspaceState();
  const [entries, setEntries] = useState<LibraryEntry[]>([...LIBRARY_ENTRIES]);
  const [category, setCategory] = useState<CategoryKey>('all');
  const [stageFilter, setStageFilter] = useState<RoadmapStageName | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const toggleSave = (id: string) => {
    const wasSaved = entries.find((entry) => entry.id === id)?.saved === true;
    if (!wasSaved) {
      // Marking a piece as important is a real action — record it once saving.
      recordLibraryPieceSaved();
    }
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, saved: !entry.saved } : entry)));
  };

  const removePiece = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  };

  const addPiece = (draft: NewPieceDraft) => {
    const piece: LibraryEntry = {
      id: `piece-${Date.now()}`,
      kind: draft.kind,
      title: draft.title,
      excerpt: draft.excerpt,
      date: 'Just now',
      stage: draft.stage,
      saved: false,
    };
    setEntries((current) => [piece, ...current]);
    // Adding a piece is a real action — record it exactly once per session.
    recordLibraryPieceAdded();
    setAdding(false);
    setSelectedId(piece.id);
  };

  const counts = useMemo(() => {
    const map = {} as Record<CategoryKey, number>;
    for (const item of CATEGORIES) map[item.key] = entries.filter(item.matches).length;
    return map;
  }, [entries]);

  const filtered = useMemo(() => {
    const matcher = CATEGORIES.find((item) => item.key === category)?.matches ?? (() => true);
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!matcher(entry)) return false;
      if (stageFilter !== 'all' && entry.stage !== stageFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = [entry.title, entry.excerpt, entry.kind, entry.stage ?? ''].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [entries, category, stageFilter, query]);

  const selected = selectedId ? entries.find((entry) => entry.id === selectedId) ?? null : null;
  const savedCount = counts.saved;
  const connectedCount = entries.filter((entry) => entry.stage).length;
  const sampleCount = entries.filter((entry) => entry.sample).length;

  const clearFilters = () => {
    setQuery('');
    setStageFilter('all');
    setCategory('all');
  };

  // Empty states explain what belongs here and always offer a way forward.
  let empty: { icon: typeof Search; title: string; description: string; action?: ReactNode } | null = null;
  if (entries.length === 0) {
    empty = {
      icon: LibraryIcon,
      title: 'Your workspace is ready.',
      description: 'Save ideas, notes, resources, and useful discoveries here as you move through your journey.',
      action: (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full bg-[#211F61] px-5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#35318A]"
          data-testid="button-library-first-item"
        >
          Add your first item <ArrowRight size={14} strokeWidth={2.2} />
        </button>
      ),
    };
  } else if (filtered.length === 0) {
    if (query.trim()) {
      empty = {
        icon: Search,
        title: `No pieces match “${query.trim()}”.`,
        description: 'Try a different word, or clear the search to see everything again.',
        action: (
          <button type="button" onClick={() => setQuery('')} className={QUIET_BUTTON} data-testid="button-library-clear-search">
            Clear search
          </button>
        ),
      };
    } else if (stageFilter !== 'all') {
      empty = {
        icon: RouteIcon,
        title: `Nothing connected to ${stageFilter} yet.`,
        description: 'Pieces you link to this stage will gather here, so the work and the journey stay together.',
        action: (
          <button type="button" onClick={() => setStageFilter('all')} className={QUIET_BUTTON} data-testid="button-library-clear-stage">
            Show all stages
          </button>
        ),
      };
    } else if (category === 'outputs') {
      empty = {
        icon: Package,
        title: 'Outputs arrive as you create.',
        description:
          'Outputs are the things you make along the way — a page, a template, a first draft. Fluxrico will collect them here as the product grows. For now, keep the thinking that leads to them in Ideas and Notes.',
        action: (
          <Link href="/roadmap" className={QUIET_BUTTON} data-testid="link-library-empty-roadmap">
            Open Roadmap <ArrowRight size={14} strokeWidth={2} />
          </Link>
        ),
      };
    } else if (category === 'saved') {
      empty = {
        icon: Star,
        title: 'Nothing saved yet.',
        description: 'Mark any piece as important with the star, and the pieces that matter most will gather here.',
        action: (
          <button type="button" onClick={() => setCategory('all')} className={QUIET_BUTTON} data-testid="button-library-browse-all">
            Browse all pieces
          </button>
        ),
      };
    } else if (category === 'ideas') {
      empty = {
        icon: Lightbulb,
        title: 'No ideas here yet.',
        description: 'Ideas are seeds — half-formed thoughts worth keeping. Capture them before they fade.',
        action: (
          <button type="button" onClick={() => setAdding(true)} className={QUIET_BUTTON} data-testid="button-library-add-idea">
            <Plus size={14} strokeWidth={2.2} /> Add an idea
          </button>
        ),
      };
    } else if (category === 'notes') {
      empty = {
        icon: FileText,
        title: 'No notes yet.',
        description: 'Notes hold what you are learning — about your user, your problem, and yourself. Write them while they are fresh.',
        action: (
          <button type="button" onClick={() => setAdding(true)} className={QUIET_BUTTON} data-testid="button-library-add-note">
            <Plus size={14} strokeWidth={2.2} /> Add a note
          </button>
        ),
      };
    } else if (category === 'resources') {
      empty = {
        icon: Bookmark,
        title: 'No resources yet.',
        description: 'Resources are useful things you find and keep — examples, checklists, references worth returning to.',
        action: (
          <button type="button" onClick={() => setAdding(true)} className={QUIET_BUTTON} data-testid="button-library-add-resource">
            <Plus size={14} strokeWidth={2.2} /> Add a resource
          </button>
        ),
      };
    } else {
      empty = {
        icon: LibraryIcon,
        title: 'Nothing here yet.',
        description: 'Your library fills as you move through the journey. Start with one piece that matters today.',
        action: (
          <button type="button" onClick={() => setAdding(true)} className={QUIET_BUTTON} data-testid="button-library-add-generic">
            <Plus size={14} strokeWidth={2.2} /> Add an item
          </button>
        ),
      };
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px]">
        <PageHeader
          eyebrow="Library / your workspace"
          title="Library"
          description="The place to keep ideas, notes, saved pieces, resources, and outputs — each one connected to the stage of the journey it belongs to."
          actions={
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setAdding(true);
              }}
              className="fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full bg-[#211F61] px-5 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#35318A]"
              data-testid="button-library-add"
            >
              <Plus size={15} strokeWidth={2.2} /> Add item
            </button>
          }
        />

        {adding && <AddItemForm onAdd={addPiece} onCancel={() => setAdding(false)} />}

        {selected ? (
          <div className="mt-6">
            <LibraryDetail
              entry={selected}
              currentStage={journey.currentStage}
              onBack={() => setSelectedId(null)}
              onToggleSave={toggleSave}
              onRemove={removePiece}
            />
          </div>
        ) : (
          <>
            {/* Search and stage filter: prominent, quiet, always reachable. */}
            <div className="fluxrico-rise fluxrico-rise-delay-1 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search size={17} strokeWidth={1.9} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8CAD]" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your library…"
                  aria-label="Search your library"
                  className="fluxrico-focus min-h-11 w-full rounded-xl border border-[#DADBEA] bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-[#25265A] outline-none transition-colors placeholder:font-medium placeholder:text-[#A0A2B7] hover:border-[#C3C5DE] focus:border-[#AAA5E5]"
                  data-testid="input-library-search"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="fluxrico-focus absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8A8CAD] transition-colors hover:bg-[#F4F4FB] hover:text-[#383777]"
                    data-testid="button-library-search-clear"
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                )}
              </div>
              <label className="block sm:w-[15rem]">
                <span className="sr-only">Filter by journey stage</span>
                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value as RoadmapStageName | 'all')}
                  className="fluxrico-focus min-h-11 w-full rounded-xl border border-[#DADBEA] bg-white px-3 text-sm font-semibold text-[#25265A] outline-none transition-colors hover:border-[#C3C5DE] focus:border-[#AAA5E5]"
                  data-testid="select-library-stage-filter"
                >
                  <option value="all">All stages</option>
                  {ROADMAP_STAGES.map((info) => (
                    <option key={info.name} value={info.name}>
                      {info.number} · {info.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Categories: filter in place, without leaving the page. */}
            <div className="fluxrico-rise fluxrico-rise-delay-1 mt-4 flex flex-wrap gap-2" role="group" aria-label="Library categories">
              {CATEGORIES.map((item) => {
                const active = category === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                    aria-pressed={active}
                    className={`fluxrico-focus inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.66rem] font-bold uppercase tracking-[0.13em] transition-colors ${
                      active
                        ? 'border-[#6256DB] bg-[#F0EFFF] text-[#5147C2]'
                        : 'border-[#DADBEA] bg-white text-[#5B56B5] hover:border-[#8E88E1]'
                    }`}
                    data-testid={`tab-library-${item.key}`}
                  >
                    {item.label}
                    <span className={`font-mono text-[0.6rem] ${active ? 'text-[#6258D0]' : 'text-[#A0A2B7]'}`}>{counts[item.key]}</span>
                  </button>
                );
              })}
            </div>

            {/* Content: the pieces themselves, or an intentional empty state. */}
            <div className="fluxrico-rise fluxrico-rise-delay-2 mt-6">
              {filtered.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filtered.map((entry) => (
                    <LibraryCard
                      key={entry.id}
                      entry={entry}
                      currentStage={journey.currentStage}
                      onOpen={setSelectedId}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              ) : (
                empty && <EmptyState {...empty} />
              )}
            </div>

            {/* Quiet footer: honest counts, no invented activity. */}
            {entries.length > 0 && (
              <div className="mt-8 flex flex-col gap-2 border-t border-[#DDDEEC] pt-5 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-[34rem] text-xs leading-5 text-[#888AA4]">
                  {entries.length} piece{entries.length === 1 ? '' : 's'} · {savedCount} saved · {connectedCount} connected to your journey.
                  {sampleCount > 0 && ' Starter pieces are marked Sample and can be removed once your own pieces replace them.'}
                </p>
                <p className="max-w-[24rem] text-xs leading-5 text-[#9A9CB3] sm:text-right">
                  Library is part of the free foundation — richer organization and insights are on the way.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
