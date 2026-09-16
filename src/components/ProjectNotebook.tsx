import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NotebookText, Check, Loader2, Pencil, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatTimestamp } from '../lib/chat';
import { NotebookSection } from '../types';

interface ProjectNotebookProps {
  clientUserId: string;
  viewerLabel: string;
}

const DEFAULT_SECTION_KEY = 'overview';
const DEFAULT_SECTION_LABEL = 'Overview';

const slugify = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'section';

const rowToSection = (row: any): NotebookSection => ({
  key: row.section,
  label: row.label ?? row.section,
  content: row.content ?? '',
  sortOrder: row.sort_order ?? 0,
  updatedBy: row.updated_by ?? null,
  updatedAt: row.updated_at ?? null
});

export const ProjectNotebook: React.FC<ProjectNotebookProps> = ({ clientUserId, viewerLabel }) => {
  const [sections, setSections] = useState<NotebookSection[]>([]);
  const [activeKey, setActiveKey] = useState<string>(DEFAULT_SECTION_KEY);
  const [draft, setDraft] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const isDirtyRef = useRef(false);
  const isFocusedRef = useRef(false);
  const activeKeyRef = useRef(activeKey);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemoteRef = useRef<Record<string, NotebookSection>>({});

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  // Initial load + realtime subscription, scoped to this client's rows only
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .eq('user_id', clientUserId)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (!error && data && data.length > 0) {
        const loaded = data.map(rowToSection);
        setSections(loaded);
        setActiveKey(loaded[0].key);
        setDraft(loaded[0].content);
      } else {
        // First time this client's notebook is opened — seed the default section
        const { data: seeded } = await supabase
          .from('project_notes')
          .upsert(
            { user_id: clientUserId, section: DEFAULT_SECTION_KEY, label: DEFAULT_SECTION_LABEL, content: '', sort_order: 0 },
            { onConflict: 'user_id,section' }
          )
          .select()
          .single();
        if (!cancelled && seeded) {
          setSections([rowToSection(seeded)]);
          setActiveKey(seeded.section);
          setDraft('');
        }
      }
      setIsLoaded(true);
    }

    load();

    const channel = supabase
      .channel(`project_notes:${clientUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_notes', filter: `user_id=eq.${clientUserId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const removedKey = (payload.old as any)?.section;
            if (!removedKey) return;
            setSections((prev) => {
              const remaining = prev.filter((s) => s.key !== removedKey);
              if (removedKey === activeKeyRef.current && remaining.length > 0) {
                setActiveKey(remaining[0].key);
                setDraft(remaining[0].content);
              }
              return remaining;
            });
            return;
          }

          const row = payload.new as any;
          if (!row) return;
          const incoming = rowToSection(row);

          // Never stomp on text the user is actively typing right now — stash
          // it and apply once they leave the field or stop typing.
          if (incoming.key === activeKeyRef.current && (isFocusedRef.current || isDirtyRef.current)) {
            pendingRemoteRef.current[incoming.key] = incoming;
            return;
          }

          setSections((prev) => {
            const exists = prev.some((s) => s.key === incoming.key);
            const next = exists
              ? prev.map((s) => (s.key === incoming.key ? incoming : s))
              : [...prev, incoming].sort((a, b) => a.sortOrder - b.sortOrder);
            return next;
          });
          if (incoming.key === activeKeyRef.current) {
            setDraft(incoming.content);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [clientUserId]);

  const persist = async (key: string, content: string) => {
    setSaveState('saving');
    const existing = sections.find((s) => s.key === key);
    const { data, error } = await supabase
      .from('project_notes')
      .upsert(
        {
          user_id: clientUserId,
          section: key,
          label: existing?.label ?? key,
          content,
          sort_order: existing?.sortOrder ?? 0,
          updated_by: viewerLabel,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,section' }
      )
      .select()
      .single();

    isDirtyRef.current = false;

    if (!error && data) {
      const saved = rowToSection(data);
      setSections((prev) => prev.map((s) => (s.key === key ? saved : s)));
    }
    setSaveState('saved');

    // Now that we're done editing, apply anything that arrived while we were
    // typing — but only if it's actually newer than what we just saved, so we
    // don't revert our own fresh save back to a stale stashed copy.
    const pending = pendingRemoteRef.current[key];
    if (pending) {
      delete pendingRemoteRef.current[key];
      const pendingIsNewer = !data?.updated_at || (pending.updatedAt && pending.updatedAt > data.updated_at);
      if (pendingIsNewer) {
        setSections((prev) => prev.map((s) => (s.key === key ? pending : s)));
        if (key === activeKeyRef.current) {
          setDraft(pending.content);
        }
      }
    }
  };

  const flushSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (isDirtyRef.current) {
      void persist(activeKeyRef.current, draft);
    }
  };

  const handleChange = (value: string) => {
    setDraft(value);
    isDirtyRef.current = true;
    setSaveState('idle');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const keyAtEdit = activeKey;
    saveTimerRef.current = setTimeout(() => {
      void persist(keyAtEdit, value);
    }, 900);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    flushSave();
  };

  const handleSwitchSection = (nextKey: string) => {
    if (nextKey === activeKey) return;
    flushSave();
    const next = sections.find((s) => s.key === nextKey);
    setActiveKey(nextKey);
    setDraft(next?.content ?? '');
    isDirtyRef.current = false;
    setSaveState('idle');
  };

  const handleAddSection = async () => {
    const label = newSectionLabel.trim();
    if (!label) return;

    const existingKeys = new Set(sections.map((s) => s.key));
    let key = slugify(label);
    if (existingKeys.has(key)) {
      key = `${key}_${Math.random().toString(36).slice(2, 6)}`;
    }
    const sortOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sortOrder)) + 1 : 0;

    const { data, error } = await supabase
      .from('project_notes')
      .insert({ user_id: clientUserId, section: key, label, content: '', sort_order: sortOrder, updated_by: viewerLabel })
      .select()
      .single();

    if (!error && data) {
      const created = rowToSection(data);
      setSections((prev) => [...prev, created]);
      setActiveKey(created.key);
      setDraft('');
    }
    setNewSectionLabel('');
    setIsAddingSection(false);
  };

  const handleDeleteSection = async (key: string) => {
    if (sections.length <= 1) {
      setConfirmDeleteKey(null);
      return;
    }

    const { error } = await supabase.from('project_notes').delete().eq('user_id', clientUserId).eq('section', key);
    if (!error) {
      setSections((prev) => {
        const remaining = prev.filter((s) => s.key !== key);
        if (key === activeKey && remaining.length > 0) {
          setActiveKey(remaining[0].key);
          setDraft(remaining[0].content);
        }
        return remaining;
      });
    }
    setConfirmDeleteKey(null);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const activeSection = useMemo(() => sections.find((s) => s.key === activeKey), [sections, activeKey]);

  return (
    <div className="bg-white border border-[#e5e9f5] rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 lg:px-6 py-4 border-b border-[#e5e9f5] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <NotebookText className="w-4 h-4 text-blue-600" />
          <h3 className="font-display text-sm font-bold text-slate-900">Project Notebook</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            {saveState === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            )}
            {saveState === 'saved' && (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                Saved
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditMode((v) => !v);
              setIsAddingSection(false);
              setConfirmDeleteKey(null);
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isEditMode ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
            }`}
            title="Edit sections"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 lg:px-6 pt-4 flex flex-wrap items-center gap-2">
        {sections.map((s) => (
          <div key={s.key} className="relative">
            {confirmDeleteKey === s.key ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700">
                <span>Delete "{s.label}"?</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSection(s.key)}
                  className="px-2 py-0.5 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteKey(null)}
                  className="px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSwitchSection(s.key)}
                className={`pl-3 pr-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeKey === s.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
                {isEditMode && sections.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteKey(s.key);
                    }}
                    className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer ${
                      activeKey === s.key ? 'hover:bg-blue-700' : 'hover:bg-slate-300'
                    }`}
                    title={`Delete ${s.label}`}
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
            )}
          </div>
        ))}

        {isEditMode && (
          isAddingSection ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newSectionLabel}
                onChange={(e) => setNewSectionLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddSection();
                  }
                  if (e.key === 'Escape') {
                    setIsAddingSection(false);
                    setNewSectionLabel('');
                  }
                }}
                placeholder="Section name"
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 w-32"
              />
              <button
                type="button"
                onClick={() => void handleAddSection()}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingSection(false);
                  setNewSectionLabel('');
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingSection(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 cursor-pointer"
              title="Add section"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      <div className="p-5 lg:p-6">
        {isLoaded && activeSection && (
          <>
            <textarea
              value={draft}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => {
                isFocusedRef.current = true;
              }}
              onBlur={handleBlur}
              placeholder={`Write notes for "${activeSection.label}"...`}
              className="w-full min-h-[180px] resize-y bg-[#fbfcfe] border border-slate-200 rounded-xl p-4 text-sm text-slate-800 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
            />
            <div className="mt-2 text-[11px] text-slate-400">
              {activeSection.updatedBy && activeSection.updatedAt
                ? `Last edited by ${activeSection.updatedBy} · ${formatTimestamp(activeSection.updatedAt)}`
                : 'Not started yet'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
