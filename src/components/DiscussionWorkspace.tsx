import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, SpecFile, EngagementModelId } from '../types';
import {
  INITIAL_MESSAGES,
  STARTER_CHIPS,
  INITIAL_SPEC_FILES,
  ENGAGEMENT_MODELS,
  generateArchitectResponse
} from '../data/initialData';
import { AudioBriefModal } from './AudioBriefModal';
import { SchemaModal } from './SchemaModal';
import {
  Paperclip,
  Mic,
  Network,
  ArrowRight,
  Send,
  Check,
  Clock,
  Shield,
  Phone,
  Mail,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface DiscussionWorkspaceProps {
  user: UserProfile;
  onNavigate: (view: 'landing' | 'workspace') => void;
}

export const DiscussionWorkspace: React.FC<DiscussionWorkspaceProps> = ({
  user,
  onNavigate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [specFiles, setSpecFiles] = useState<SpecFile[]>(INITIAL_SPEC_FILES);
  const [isTyping, setIsTyping] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussion' | 'specs'>('discussion');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedModelInfo = ENGAGEMENT_MODELS.find(
    (m) => m.id === user.selectedModel
  ) || ENGAGEMENT_MODELS[1];

  // Auto-scroll chat stream to bottom when messages update
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({
        top: chatStreamRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      senderName: user.name || 'Marcus Vance',
      senderInitials: user.initials || 'MV',
      text: content,
      timestamp: 'Sent just now'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Step 1: Immediate architect receipt notice after 400ms
    setTimeout(() => {
      const receiptNotice: ChatMessage = {
        id: `msg-receipt-${Date.now()}`,
        sender: 'system',
        senderName: 'System Notice',
        text: 'Alex Rivera has picked up your brief. Preparing initial architecture review notes.',
        timestamp: 'Just now',
        architectReviewNotice: true
      };
      setMessages((prev) => [...prev, receiptNotice]);

      // Step 2: Architect starts typing
      setIsTyping(true);

      // Step 3: Deliver Alex's custom architectural reply
      setTimeout(() => {
        setIsTyping(false);
        const replyText = generateArchitectResponse(content, user.organization || 'your team');
        const architectReply: ChatMessage = {
          id: `msg-arch-${Date.now()}`,
          sender: 'architect',
          senderName: 'Alex Rivera',
          senderTitle: 'Lead Systems Architect',
          senderInitials: 'AR',
          text: replyText,
          timestamp: 'Just now'
        };
        setMessages((prev) => [...prev, architectReply]);
      }, 1500);
    }, 450);
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

    const newFiles: SpecFile[] = (Array.from(files) as File[]).map((file: File, idx: number) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      type: file.name.endsWith('.csv') || file.name.endsWith('.xlsx')
        ? 'Data Sheet'
        : file.name.endsWith('.json')
        ? 'Schema / API Spec'
        : 'Architecture Document',
      dateAdded: 'Just now'
    }));

    setSpecFiles((prev) => [...newFiles, ...prev]);

    // Add note in chat
    const fileNotice: ChatMessage = {
      id: `msg-file-${Date.now()}`,
      sender: 'user',
      senderName: user.name || 'Marcus Vance',
      senderInitials: user.initials || 'MV',
      text: `Uploaded new project specification: ${newFiles.map(f => f.name).join(', ')}`,
      timestamp: 'Just now',
      attachments: newFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
    };
    setMessages((prev) => [...prev, fileNotice]);

    setTimeout(() => {
      const receipt: ChatMessage = {
        id: `msg-receipt-file-${Date.now()}`,
        sender: 'system',
        senderName: 'System Notice',
        text: `Alex Rivera received ${newFiles.length} file(s) for diagnostic parsing.`,
        timestamp: 'Just now',
        architectReviewNotice: true
      };
      setMessages((prev) => [...prev, receipt]);
    }, 400);
  };

  const handleAudioAttach = (fileName: string, duration: string) => {
    const audioMsg: ChatMessage = {
      id: `msg-audio-${Date.now()}`,
      sender: 'user',
      senderName: user.name || 'Marcus Vance',
      senderInitials: user.initials || 'MV',
      text: `Attached verbal audio brief (${duration}) for Alex Rivera`,
      timestamp: 'Just now',
      attachments: [{ name: fileName, type: 'Audio Brief', size: duration }]
    };
    setMessages((prev) => [...prev, audioMsg]);

    setTimeout(() => {
      const receipt: ChatMessage = {
        id: `msg-ack-audio-${Date.now()}`,
        sender: 'system',
        senderName: 'System Notice',
        text: 'Alex Rivera is listening to your audio briefing note.',
        timestamp: 'Just now',
        architectReviewNotice: true
      };
      setMessages((prev) => [...prev, receipt]);
    }, 500);
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 py-6 flex flex-col lg:flex-row gap-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.csv,.xlsx,.json,.yaml,.fig,.png,.jpg"
      />

      {/* Audio Modal */}
      <AudioBriefModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onAttachAudio={handleAudioAttach}
      />

      {/* Schema Modal */}
      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        onInsertSchema={handleSchemaInsert}
      />

      {/* Left / Center: Dominant Discussion Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-white border border-[#e5e9f5] rounded-2xl shadow-sm overflow-hidden min-h-[640px]">
        {/* Workspace Top Banner Header */}
        <div className="p-5 lg:p-6 border-b border-[#e5e9f5] bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Audit Workspace · {user.organization || 'Northline Logistics'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-medium text-slate-500">
                  Fixed Scope Model: {selectedModelInfo.title}
                </span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Start explaining your ideas to our team
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                You are chatting directly with Alex, our Lead Systems Architect — a real human engineer, not an AI bot. Share your workflow bottlenecks, system challenges, or software goals.
              </p>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Assigned Lead Architect Profile Strip */}
        <div className="px-5 lg:px-6 py-3.5 bg-white border-b border-[#e5e9f5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#4361ee] flex items-center justify-center text-white font-bold text-sm shadow-xs font-display">
                AR
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                title="Online now"
              ></span>
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">Alex Rivera</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Real Human Engineer • Active now
                </span>
              </div>
              <span className="text-xs text-slate-500 truncate">
                Lead Systems Architect · Socio Systems Engineering
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">Diagnostic turnaround:</span>
              <span className="text-xs font-bold text-slate-800">1–3 Days</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">Ownership:</span>
              <span className="text-xs font-bold text-blue-600">100% Client Code &amp; IP</span>
            </div>
          </div>
        </div>

        {/* Scrollable Conversation Feed */}
        <div
          ref={chatStreamRef}
          className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto custom-scroll flex flex-col gap-4 min-h-[360px] max-h-[550px] bg-[#fbfcfe]"
          id="chat-stream"
        >
          {/* Welcome Briefing Card */}
          <div className="bg-slate-50/80 border border-[#e1e6f7] rounded-xl p-5 shadow-2xs">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#4361ee] flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs font-display">
                AR
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Alex Rivera</span>
                  <span className="text-[11px] text-slate-500">Lead Systems Architect</span>
                </div>
                <span className="text-[11px] text-slate-400">Direct Workspace Message</span>
              </div>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed mb-4">
              Hi, I'm Alex Rivera, Lead Systems Architect at Socio. I review all audit requests personally. Tell me about the software you need or what tasks are slowing your team down — I'll personally review your workflow and outline architectural solutions.
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
                    </span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Message History */}
          {messages.slice(1).map((msg) => {
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
                  AR
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="bg-white border border-[#e5e9f5] rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs text-sm text-slate-800 leading-relaxed">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">Alex Rivera</span>
                      <span className="text-[10px] text-slate-400">Lead Architect Analysis</span>
                    </div>
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] ml-1">
                    <span>Alex Rivera</span> · <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl self-start shadow-2xs">
              <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                AR
              </div>
              <span className="font-medium">Alex Rivera is analyzing your requirements...</span>
              <div className="flex gap-1 items-center ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse delay-150"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse delay-300"></span>
              </div>
            </div>
          )}
        </div>

        {/* Large Interactive Message Input Dock */}
        <div className="p-4 lg:p-5 border-t border-[#e5e9f5] bg-slate-50/50">
          <div className="bg-white border border-[#d8e0f5] rounded-xl p-3 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm p-1.5 focus:outline-none resize-none custom-scroll leading-relaxed"
              id="message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Explain your ideas, workflow bottlenecks, or questions for Alex..."
              rows={3}
            ></textarea>

            <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-slate-100">
              {/* Rich Tool Attachments */}
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Attach file, spec mockup, or export"
                  type="button"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAudioModalOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Record quick audio brief"
                  type="button"
                >
                  <Mic className="w-4 h-4" />
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

      {/* Right: Desktop Side Context & Project Overview Panel (~360px) */}
      <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 flex flex-col gap-4">
        {/* Engagement Scope Card */}
        <div className="bg-white border border-[#e5e9f5] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {selectedModelInfo.tag}
              </span>
              <h3 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                {selectedModelInfo.title}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {selectedModelInfo.duration}
            </span>
          </div>

          <div className="py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Audit Status</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Reviewing Intake (Day 1 of 3)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Code Handover</span>
              <span className="font-semibold text-slate-800">100% IP &amp; Git Repository</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Contract Guarantee</span>
              <span className="font-semibold text-slate-800">Fixed Scope, No Surcharge</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('landing')}
              className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1 cursor-pointer"
            >
              Compare Other Engagement Models →
            </button>
          </div>
        </div>

        {/* Project Specs & Files */}
        <div className="bg-white border border-[#e5e9f5] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Project Specs &amp; Files ({specFiles.length})
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
              Drag &amp; drop architecture specs
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PDF, OpenAPI schemas, CSV or Figma exports
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

        {/* Privacy & Security Card */}
        <div className="bg-white border border-[#e5e9f5] rounded-2xl p-5 shadow-sm space-y-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Privacy &amp; Security
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                <Shield className="w-3 h-3 text-blue-600" /> Mutual NDA
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                <Shield className="w-3 h-3 text-blue-600" /> Zero Telemetry
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                <Check className="w-3 h-3 text-emerald-600" /> SOC-2 Type II
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 block mb-1">
              Direct Engineering Escalation Hotline:
            </span>
            <div className="flex items-center justify-between text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-900 font-semibold">+1 (888) 420-SOCIO</span>
              </div>
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

        {/* Audit Methodology Roadmap tracker */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Diagnostic Delivery Stages
          </span>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Workflow &amp; Gap Audit</span>
                <span className="text-[11px] text-slate-500">Alex isolates manual tasks and bottlenecks (In Progress)</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 opacity-75">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Solution Roadmap &amp; Spec</span>
                <span className="text-[11px] text-slate-500">Fixed-scope blueprint and delivery milestones</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 opacity-60">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Production Handover</span>
                <span className="text-[11px] text-slate-500">100% Code repository &amp; keys deployed</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
