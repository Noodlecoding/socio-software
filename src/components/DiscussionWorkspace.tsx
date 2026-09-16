import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, SpecFile, EngagementModelId } from '../types';
import { STARTER_CHIPS } from '../data/initialData';
import { supabase } from '../lib/supabaseClient';
import { formatTimestamp, rowToChatMessage } from '../lib/chat';
import { SchemaModal } from './SchemaModal';
import { ProjectNotebook } from './ProjectNotebook';
import {
  Paperclip,
  Network,
  ArrowRight,
  Send,
  Check,
  Clock,
  Shield,
  Mail,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle,
  DollarSign,
  MessageCircle
} from 'lucide-react';

interface DiscussionWorkspaceProps {
  user: UserProfile;
  onNavigate: (view: 'landing' | 'workspace') => void;
}

const rowToSpecFile = (row: any): SpecFile => ({
  id: row.id,
  name: row.name,
  size: row.size,
  type: row.type,
  dateAdded: formatTimestamp(row.created_at)
});

export const DiscussionWorkspace: React.FC<DiscussionWorkspaceProps> = ({
  user,
  onNavigate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [specFiles, setSpecFiles] = useState<SpecFile[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussion' | 'specs'>('discussion');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load this user's messages and spec files from Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoadingWorkspace(true);

      const [messagesResult, filesResult] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('spec_files')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (cancelled) return;

      if (!messagesResult.error && messagesResult.data) {
        setMessages(messagesResult.data.map(rowToChatMessage));
      }
      if (!filesResult.error && filesResult.data) {
        setSpecFiles(filesResult.data.map(rowToSpecFile));
      }
      setIsLoadingWorkspace(false);
    }

    loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  // Live updates: messages the admin sends from the dashboard arrive here in real time
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const incoming = rowToChatMessage(payload.new);
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Auto-scroll chat stream to bottom when messages update
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({
        top: chatStreamRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const persistMessage = async (msg: ChatMessage) => {
    const { error } = await supabase.from('messages').insert({
      id: msg.id,
      user_id: user.id,
      sender: msg.sender,
      sender_name: msg.senderName,
      sender_title: msg.senderTitle ?? null,
      sender_initials: msg.senderInitials ?? null,
      text: msg.text,
      attachments: msg.attachments ?? null,
      is_preliminary_plan: msg.isPreliminaryPlan ?? false,
      architect_review_notice: msg.architectReviewNotice ?? false
    });
    if (error) console.error('Failed to save message:', error.message);
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      senderName: user.name,
      senderInitials: user.initials,
      text: content,
      timestamp: 'Sent just now'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    void persistMessage(userMessage);
  };

  const handleStarterPrompt = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: SpecFile[] = (Array.from(files) as File[]).map((file: File) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      type: file.name.endsWith('.csv') || file.name.endsWith('.xlsx')
        ? 'Spreadsheet'
        : file.name.endsWith('.json')
        ? 'Data File'
        : 'Document',
      dateAdded: 'Just now'
    }));

    setSpecFiles((prev) => [...newFiles, ...prev]);
    supabase
      .from('spec_files')
      .insert(newFiles.map((f) => ({ id: f.id, user_id: user.id, name: f.name, size: f.size, type: f.type })))
      .then(({ error }) => {
        if (error) console.error('Failed to save spec files:', error.message);
      });

    // Add note in chat
    const fileNotice: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      senderName: user.name,
      senderInitials: user.initials,
      text: `Shared file(s): ${newFiles.map(f => f.name).join(', ')}`,
      timestamp: 'Just now',
      attachments: newFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
    };
    setMessages((prev) => [...prev, fileNotice]);
    void persistMessage(fileNotice);

    setTimeout(() => {
      const receipt: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'system',
        senderName: 'System Notice',
        text: `Alexis received your ${newFiles.length === 1 ? 'file' : `${newFiles.length} files`} and will take a look.`,
        timestamp: 'Just now',
        architectReviewNotice: true
      };
      setMessages((prev) => [...prev, receipt]);
      void persistMessage(receipt);
    }, 400);
  };

  const handleSchemaInsert = (schemaName: string, description: string) => {
    const promptWithSchema = `We'd like to structure this around the "${schemaName}" pattern: ${description}. Specifically for our team: `;
    setInputText(promptWithSchema);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setSpecFiles((prev) => prev.filter((f) => f.id !== fileId));
    supabase
      .from('spec_files')
      .delete()
      .eq('id', fileId)
      .then(({ error }) => {
        if (error) console.error('Failed to delete spec file:', error.message);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingWorkspace) {
    return (
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 py-6 flex items-center justify-center text-slate-400 text-sm">
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 py-4 flex flex-col lg:flex-row gap-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.csv,.xlsx,.json,.yaml,.fig,.png,.jpg"
      />

      {/* Schema Modal */}
      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        onInsertSchema={handleSchemaInsert}
      />

      {/* Left / Center: Chat + Project Notebook stacked */}
      <div className="flex-1 flex flex-col min-w-0 gap-6">
      <main className="flex-1 flex flex-col min-w-0 bg-white border border-[#e5e9f5] rounded-2xl shadow-sm overflow-hidden min-h-[420px] max-h-[calc(100vh-140px)]">
        {/* Scrollable Conversation Feed */}
        <div
          ref={chatStreamRef}
          className="flex-1 p-3 sm:p-4 lg:p-5 overflow-y-auto custom-scroll flex flex-col gap-3 min-h-0 bg-[#fbfcfe]"
          id="chat-stream"
        >
          {/* Welcome Briefing Card */}
          <div className="bg-slate-50/80 border border-[#e1e6f7] rounded-xl p-4 shadow-2xs">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#4361ee] flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs font-display">
                  AC
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Alexis Cervantes</span>
                    <span className="text-[11px] text-slate-500">Lead Systems Architect</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Message from Alexis</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 shrink-0 whitespace-nowrap">
                Avg response: 1–5h
              </span>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed mb-3">
              Hi, I'm Alexis. I personally read every message that comes in here. Tell me what's slowing your team down or what you'd like us to build, in plain terms, no need to know any technical jargon. I'll ask follow-up questions and let you know what we can do and roughly what it would cost.
            </p>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Suggested starting points:
              </span>
              <div className="flex flex-wrap gap-2" id="starter-chips">
                {STARTER_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStarterPrompt(chip.prompt)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-600 text-slate-700 hover:text-blue-600 text-xs font-medium transition-all duration-150 flex items-center gap-1.5 shadow-2xs hover:shadow-xs group cursor-pointer text-left"
                    type="button"
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      {idx === 0 && <FileSpreadsheet className="w-3.5 h-3.5" />}
                      {idx === 1 && <FileText className="w-3.5 h-3.5" />}
                      {idx === 2 && <Network className="w-3.5 h-3.5" />}
                      {idx === 3 && <FileCode className="w-3.5 h-3.5" />}
                      {idx === 4 && <DollarSign className="w-3.5 h-3.5" />}
                      {idx === 5 && <MessageCircle className="w-3.5 h-3.5" />}
                    </span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Message History */}
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div
                  key={msg.id}
                  className="bg-white border border-[#e2e7ff] text-slate-700 text-xs rounded-xl p-3 shadow-2xs flex items-center gap-3 max-w-[90%] self-start"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>{msg.text}</div>
                </div>
              );
            }

            if (msg.sender === 'user') {
              return (
                <div
                  key={msg.id}
                  className="flex flex-col items-end gap-1.5 self-end max-w-[85%]"
                >
                  <div className="bg-[#4361ee] text-white text-sm rounded-2xl rounded-tr-xs p-4 shadow-sm leading-relaxed break-words">
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Attachments preview */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/20 flex flex-col gap-1.5">
                        {msg.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="bg-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="font-mono">{att.name}</span>
                            {att.size && (
                              <span className="text-[10px] text-white/70">({att.size})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mr-1">
                    <span>You</span> · <span>{msg.timestamp}</span>
                  </div>
                </div>
              );
            }

            // Architect reply
            return (
              <div
                key={msg.id}
                className="flex items-start gap-3 max-w-[90%] self-start"
              >
                <div className="w-8 h-8 rounded-lg bg-[#4361ee] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-2xs font-display">
                  AC
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="bg-white border border-[#e5e9f5] rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs text-sm text-slate-800 leading-relaxed">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">Alexis Cervantes</span>
                      <span className="text-[10px] text-slate-400">Reply</span>
                    </div>
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] ml-1">
                    <span>Alexis Cervantes</span> · <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Message Input Dock */}
        <div className="p-3 lg:p-4 border-t border-[#e5e9f5] bg-slate-50/50 shrink-0">
          <div className="bg-white border border-[#d8e0f5] rounded-xl p-2.5 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm p-1.5 focus:outline-none resize-none custom-scroll leading-relaxed"
              id="message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Explain your ideas, workflow bottlenecks or questions for Alexis..."
              rows={2}
            ></textarea>

            <div className="flex items-center justify-between gap-3 pt-1.5 mt-1 border-t border-slate-100">
              {/* Rich Tool Attachments */}
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Attach file, spec mockup or export"
                  type="button"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSchemaModalOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Insert system flow diagram or schema sketch"
                  type="button"
                >
                  <Network className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                  Markdown supported
                </span>
              </div>

              {/* Action button with keyboard shortcut */}
              <div className="flex items-center gap-2.5">
                <span className="hidden md:inline text-[11px] text-slate-400 font-medium">
                  Cmd + Enter to send
                </span>
                <button
                  className="px-4 py-2 rounded-lg bg-[#4361ee] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-150 cursor-pointer disabled:opacity-50"
                  id="send-button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  type="button"
                >
                  <span>Send Idea</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProjectNotebook clientUserId={user.id} viewerLabel={user.name} />
      </div>

      {/* Right: Desktop Side Context & Project Overview Panel (~360px) */}
      <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 flex flex-col gap-4">
        {/* Client Profile Card */}
        <div className="bg-white border border-[#e5e9f5] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0 font-display">
              {user.initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold text-slate-900 truncate">
                {user.name}
              </h3>
              {user.organization && (
                <span className="text-xs text-slate-500 truncate block">{user.organization}</span>
              )}
            </div>
          </div>

          <div className="py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Company</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">{user.organization || '—'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('landing')}
              className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1 cursor-pointer"
            >
              See other project examples →
            </button>
          </div>
        </div>

        {/* Project Specs & Files */}
        <div className="bg-white border border-[#e5e9f5] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Files You've Shared ({specFiles.length})
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              type="button"
            >
              + Upload
            </button>
          </div>

          {/* Drag & drop upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#dae2fd] rounded-xl p-4 text-center bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer group"
          >
            <UploadCloud className="w-6 h-6 mx-auto text-blue-600/70 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-slate-900 mt-1">
              Drag &amp; drop files here
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Spreadsheets, screenshots, documents — anything that helps explain what you need
            </p>
          </div>

          {/* Uploaded files list */}
          <div className="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto custom-scroll">
            {specFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate font-mono text-[11px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{file.type} • {file.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Trust Card */}
        <div className="bg-white border border-[#e5e9f5] rounded-2xl p-5 shadow-sm space-y-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              How We Handle Your Info
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                <Shield className="w-3 h-3 text-blue-600" /> We'll sign an NDA if you'd like one
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                <Shield className="w-3 h-3 text-blue-600" /> We don't sell or share your data
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 block mb-1">
              Questions? Reach us directly:
            </span>
            <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60">
              <a
                className="text-blue-600 font-sans hover:underline text-[11px] flex items-center gap-1"
                href="mailto:direct@socio.com"
              >
                <Mail className="w-3 h-3" />
                <span>direct@socio.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* How This Works tracker */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
            How This Works
          </span>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">We learn about your business</span>
                <span className="text-[11px] text-slate-500">Alexis figures out what's slowing you down (in progress)</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 opacity-75">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">We show you the plan and price</span>
                <span className="text-[11px] text-slate-500">You see exactly what we'll build and what it costs before anything starts</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 opacity-60">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">We hand everything over</span>
                <span className="text-[11px] text-slate-500">All the code and access, fully yours</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
