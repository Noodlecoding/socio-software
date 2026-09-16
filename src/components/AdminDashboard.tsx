import React, { useEffect, useRef, useState } from 'react';
import { AdminAffiliate, AdminAffiliateConversation, AdminConversation, AffiliateReferredClient, ChatMessage, ClientStatus, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { rowToChatMessage } from '../lib/chat';
import { downloadSpecFile } from '../lib/files';
import { Send, Users, DollarSign, Download, ChevronDown } from 'lucide-react';
import { ProjectNotebook } from './ProjectNotebook';

interface AdminDashboardProps {
  user: UserProfile;
}

const STATUS_LABELS: Record<ClientStatus, string> = {
  new_client: 'New Client',
  interested: 'Interested',
  paid: 'Paid'
};

const STATUS_STYLES: Record<ClientStatus, string> = {
  new_client: 'bg-slate-100 text-slate-700 border-slate-200',
  interested: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

function rowToConversation(row: any): AdminConversation {
  return {
    userId: row.user_id,
    fullName: row.full_name || 'Unnamed client',
    organization: row.organization || '',
    status: row.status,
    clientSince: row.client_since,
    unreadCount: row.unread_count ?? 0,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    affiliateEmail: row.affiliate_email ?? null,
    affiliateName: row.affiliate_name ?? null
  };
}

function rowToAffiliate(row: any): AdminAffiliate {
  return {
    affiliateId: row.affiliate_id,
    fullName: row.full_name || 'Unnamed affiliate',
    email: row.email || '',
    age: row.age ?? null,
    country: row.country ?? null,
    referralCode: row.referral_code,
    createdAt: row.created_at,
    leadsCount: row.leads_count ?? 0,
    dealsClosed: row.deals_closed ?? 0,
    totalDealValue: Number(row.total_deal_value ?? 0),
    totalCommissionEarned: Number(row.total_commission_earned ?? 0),
    paidOut: Number(row.paid_out ?? 0),
    commissionOwed: Number(row.commission_owed ?? 0)
  };
}

function rowToAffiliateConversation(row: any): AdminAffiliateConversation {
  return {
    affiliateId: row.affiliate_id,
    fullName: row.full_name || 'Unnamed affiliate',
    email: row.email || '',
    referralCode: row.referral_code,
    affiliateSince: row.affiliate_since,
    unreadCount: row.unread_count ?? 0,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at
  };
}

function rowToReferredClient(row: any): AffiliateReferredClient {
  return {
    userId: row.user_id,
    affiliateId: row.affiliate_id,
    fullName: row.full_name || 'Unnamed client',
    organization: row.organization || '',
    status: row.status,
    dealValue: row.deal_value != null ? Number(row.deal_value) : null,
    clientSince: row.client_since,
    commissionContribution: Number(row.commission_contribution)
  };
}

type AffiliateActivityFilter = 'all' | 'no_activity' | 'has_leads' | 'due_payment';

function matchesAffiliateActivityFilter(
  activityFilter: AffiliateActivityFilter,
  leadsCount: number,
  commissionOwed: number
): boolean {
  if (activityFilter === 'no_activity') return leadsCount === 0;
  if (activityFilter === 'has_leads') return leadsCount > 0;
  if (activityFilter === 'due_payment') return commissionOwed > 0;
  return true;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [dashboardTab, setDashboardTab] = useState<'clients' | 'affiliates' | 'affiliate-chats'>('clients');

  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [filter, setFilter] = useState<'all' | ClientStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [dealValue, setDealValue] = useState<string>('');

  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([]);
  const [isLoadingAffiliates, setIsLoadingAffiliates] = useState(true);
  const [affiliatesActivityFilter, setAffiliatesActivityFilter] = useState<AffiliateActivityFilter>('all');
  const [referredClients, setReferredClients] = useState<AffiliateReferredClient[]>([]);
  const [expandedAffiliateId, setExpandedAffiliateId] = useState<string | null>(null);
  const [confirmPayoutAffiliateId, setConfirmPayoutAffiliateId] = useState<string | null>(null);

  const [affiliateConversations, setAffiliateConversations] = useState<AdminAffiliateConversation[]>([]);
  const [isLoadingAffiliateChatList, setIsLoadingAffiliateChatList] = useState(true);
  const [affiliateChatsActivityFilter, setAffiliateChatsActivityFilter] = useState<AffiliateActivityFilter>('all');
  const [selectedAffiliateChatId, setSelectedAffiliateChatId] = useState<string | null>(null);
  const [affiliateChatMessages, setAffiliateChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAffiliateChatThread, setIsLoadingAffiliateChatThread] = useState(false);
  const [affiliateReplyText, setAffiliateReplyText] = useState('');

  const chatStreamRef = useRef<HTMLDivElement>(null);
  const affiliateChatStreamRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('admin_conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!error && data) {
      setConversations(data.filter((row: any) => row.user_id !== user.id).map(rowToConversation));
    }
    setIsLoadingList(false);
  };

  const loadAffiliates = async () => {
    const [statsResult, referredClientsResult] = await Promise.all([
      supabase.from('affiliate_stats').select('*').order('created_at', { ascending: false }),
      supabase.from('affiliate_referred_clients').select('*').order('client_since', { ascending: false })
    ]);

    if (!statsResult.error && statsResult.data) {
      setAffiliates(statsResult.data.map(rowToAffiliate));
    }
    if (!referredClientsResult.error && referredClientsResult.data) {
      setReferredClients(referredClientsResult.data.map(rowToReferredClient));
    }
    setIsLoadingAffiliates(false);
  };

  const loadAffiliateConversations = async () => {
    const { data, error } = await supabase
      .from('admin_affiliate_conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!error && data) {
      setAffiliateConversations(data.map(rowToAffiliateConversation));
    }
    setIsLoadingAffiliateChatList(false);
  };

  useEffect(() => {
    void loadConversations();
    void loadAffiliates();
    void loadAffiliateConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates: refresh both inboxes and whichever thread is open whenever any message changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        void loadConversations();
        void loadAffiliateConversations();
        const row = payload.new as any;

        if (row.user_id === selectedId) {
          const incoming = rowToChatMessage(row);
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          if (row.sender === 'user') {
            void supabase.from('messages').update({ read_by_admin: true }).eq('id', row.id);
          }
        }

        if (row.user_id === selectedAffiliateChatId) {
          const incoming = rowToChatMessage(row);
          setAffiliateChatMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          if (row.sender === 'user') {
            void supabase.from('messages').update({ read_by_admin: true }).eq('id', row.id);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedAffiliateChatId]);

  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({ top: chatStreamRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (affiliateChatStreamRef.current) {
      affiliateChatStreamRef.current.scrollTo({ top: affiliateChatStreamRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [affiliateChatMessages]);

  const openConversation = async (userId: string) => {
    setSelectedId(userId);
    setIsLoadingThread(true);
    setMessages([]);
    setDealValue('');

    const [messagesResult, profileResult] = await Promise.all([
      supabase.from('messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('profiles').select('deal_value').eq('id', userId).single()
    ]);

    if (!messagesResult.error && messagesResult.data) {
      setMessages(messagesResult.data.map(rowToChatMessage));
    }
    if (!profileResult.error && profileResult.data?.deal_value != null) {
      setDealValue(String(profileResult.data.deal_value));
    }
    setIsLoadingThread(false);

    await supabase
      .from('messages')
      .update({ read_by_admin: true })
      .eq('user_id', userId)
      .eq('sender', 'user')
      .eq('read_by_admin', false);

    setConversations((prev) => prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c)));
  };

  const handleSendReply = async () => {
    const content = replyText.trim();
    if (!content || !selectedId) return;

    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'architect',
      senderName: 'Alexis Cervantes',
      senderTitle: 'Lead Systems Architect',
      senderInitials: 'AC',
      text: content,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, reply]);
    setReplyText('');

    const { error } = await supabase.from('messages').insert({
      id: reply.id,
      user_id: selectedId,
      sender: 'architect',
      sender_name: 'Alexis Cervantes',
      sender_title: 'Lead Systems Architect',
      sender_initials: 'AC',
      text: content,
      read_by_admin: true
    });
    if (error) console.error('Failed to send reply:', error.message);

    setConversations((prev) =>
      prev.map((c) =>
        c.userId === selectedId ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() } : c
      )
    );
  };

  const openAffiliateChat = async (affiliateId: string) => {
    setSelectedAffiliateChatId(affiliateId);
    setIsLoadingAffiliateChatThread(true);
    setAffiliateChatMessages([]);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', affiliateId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setAffiliateChatMessages(data.map(rowToChatMessage));
    }
    setIsLoadingAffiliateChatThread(false);

    await supabase
      .from('messages')
      .update({ read_by_admin: true })
      .eq('user_id', affiliateId)
      .eq('sender', 'user')
      .eq('read_by_admin', false);

    setAffiliateConversations((prev) => prev.map((c) => (c.affiliateId === affiliateId ? { ...c, unreadCount: 0 } : c)));
  };

  const handleSendAffiliateReply = async () => {
    const content = affiliateReplyText.trim();
    if (!content || !selectedAffiliateChatId) return;

    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'architect',
      senderName: 'Alexis Cervantes',
      senderTitle: 'Lead Systems Architect',
      senderInitials: 'AC',
      text: content,
      timestamp: 'Just now'
    };

    setAffiliateChatMessages((prev) => [...prev, reply]);
    setAffiliateReplyText('');

    const { error } = await supabase.from('messages').insert({
      id: reply.id,
      user_id: selectedAffiliateChatId,
      sender: 'architect',
      sender_name: 'Alexis Cervantes',
      sender_title: 'Lead Systems Architect',
      sender_initials: 'AC',
      text: content,
      read_by_admin: true
    });
    if (error) console.error('Failed to send reply:', error.message);

    setAffiliateConversations((prev) =>
      prev.map((c) =>
        c.affiliateId === selectedAffiliateChatId ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() } : c
      )
    );
  };

  const handleStatusChange = async (status: ClientStatus) => {
    if (!selectedId) return;
    setConversations((prev) => prev.map((c) => (c.userId === selectedId ? { ...c, status } : c)));
    const { error } = await supabase.from('profiles').update({ status }).eq('id', selectedId);
    if (error) console.error('Failed to update status:', error.message);
    // Deals closed / commission owed are computed live from client status +
    // deal value (see affiliate_stats), so just refresh the affiliate list.
    void loadAffiliates();
  };

  const handleSaveDealValue = async () => {
    if (!selectedId) return;
    const value = dealValue.trim() === '' ? null : Number(dealValue);
    if (value !== null && Number.isNaN(value)) return;
    const { error } = await supabase.from('profiles').update({ deal_value: value }).eq('id', selectedId);
    if (error) console.error('Failed to save deal value:', error.message);
    void loadAffiliates();
  };

  const handleMarkAffiliatePaid = async (affiliateId: string, totalCommissionEarned: number) => {
    setConfirmPayoutAffiliateId(null);
    const { error } = await supabase.from('affiliates').update({ paid_out: totalCommissionEarned }).eq('id', affiliateId);
    if (error) console.error('Failed to mark affiliate as paid:', error.message);
    void loadAffiliates();
  };

  const filteredConversations = conversations.filter((c) => filter === 'all' || c.status === filter);
  const selectedConversation = conversations.find((c) => c.userId === selectedId) || null;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const selectedAffiliateConversation = affiliateConversations.find((c) => c.affiliateId === selectedAffiliateChatId) || null;
  const totalAffiliateUnread = affiliateConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const affiliateById = new Map<string, AdminAffiliate>(affiliates.map((a) => [a.affiliateId, a]));

  const filteredAffiliates = affiliates.filter((a) =>
    matchesAffiliateActivityFilter(affiliatesActivityFilter, a.leadsCount, a.commissionOwed)
  );
  const filteredAffiliateConversations = affiliateConversations.filter((c) => {
    const stats = affiliateById.get(c.affiliateId);
    return matchesAffiliateActivityFilter(affiliateChatsActivityFilter, stats?.leadsCount ?? 0, stats?.commissionOwed ?? 0);
  });

  const filterTabs: { id: 'all' | ClientStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'new_client', label: 'New Client' },
    { id: 'interested', label: 'Interested' },
    { id: 'paid', label: 'Paid' }
  ];

  const affiliateActivityFilterTabs: { id: AffiliateActivityFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'no_activity', label: 'No Activity' },
    { id: 'has_leads', label: 'Leads Referred' },
    { id: 'due_payment', label: 'Due Payments' }
  ];

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 py-6 flex flex-col gap-6 min-h-[640px]">
      {/* Dashboard section selector */}
      <div className="flex items-center gap-1.5 bg-white border border-[#e5e9f5] rounded-xl p-1.5 w-fit shadow-sm">
        <button
          onClick={() => setDashboardTab('clients')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            dashboardTab === 'clients' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Clients
        </button>
        <button
          onClick={() => setDashboardTab('affiliates')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            dashboardTab === 'affiliates' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Affiliates
        </button>
        <button
          onClick={() => setDashboardTab('affiliate-chats')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
            dashboardTab === 'affiliate-chats' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Affiliate Chats
          {totalAffiliateUnread > 0 && (
            <span
              className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                dashboardTab === 'affiliate-chats' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
              }`}
            >
              {totalAffiliateUnread}
            </span>
          )}
        </button>
      </div>

      {dashboardTab === 'affiliate-chats' ? (
        <div className="flex-1 w-full flex flex-col lg:flex-row gap-6 min-h-[640px]">
          {/* Affiliate conversation list */}
          <aside className="w-full lg:w-[340px] shrink-0 bg-white border border-[#e5e9f5] rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#e5e9f5]">
              <h2 className="font-display text-lg font-bold text-slate-900">Affiliate Chats</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalAffiliateUnread > 0 ? `${totalAffiliateUnread} unread message${totalAffiliateUnread === 1 ? '' : 's'}` : 'All caught up'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {affiliateActivityFilterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAffiliateChatsActivityFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      affiliateChatsActivityFilter === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll">
              {isLoadingAffiliateChatList ? (
                <div className="p-4 text-xs text-slate-400">Loading...</div>
              ) : filteredAffiliateConversations.length === 0 ? (
                <div className="p-4 text-xs text-slate-400">No affiliates here yet.</div>
              ) : (
                filteredAffiliateConversations.map((c) => (
                  <button
                    key={c.affiliateId}
                    onClick={() => void openAffiliateChat(c.affiliateId)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedAffiliateChatId === c.affiliateId ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">{c.fullName}</span>
                      {c.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block mt-0.5">{c.email}</span>
                    {c.lastMessage && <p className="text-xs text-slate-500 mt-1 truncate">{c.lastMessage}</p>}
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Affiliate conversation thread */}
          <main className="flex-1 flex flex-col min-w-0 bg-white border border-[#e5e9f5] rounded-2xl shadow-sm overflow-hidden min-h-[640px]">
            {!selectedAffiliateConversation ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                Pick an affiliate on the left to start replying.
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-[#e5e9f5]">
                  <h3 className="font-display text-sm font-bold text-slate-900">{selectedAffiliateConversation.fullName}</h3>
                  <p className="text-xs text-slate-500">{selectedAffiliateConversation.email}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">Referral code: {selectedAffiliateConversation.referralCode}</p>
                </div>

                <div ref={affiliateChatStreamRef} className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scroll flex flex-col gap-3 bg-[#fbfcfe]">
                  {isLoadingAffiliateChatThread ? (
                    <div className="text-xs text-slate-400">Loading conversation...</div>
                  ) : affiliateChatMessages.length === 0 ? (
                    <div className="text-xs text-slate-400">No messages yet.</div>
                  ) : (
                    affiliateChatMessages.map((msg) => {
                      const isAffiliate = msg.sender === 'user';
                      return (
                        <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isAffiliate ? 'self-start' : 'self-end items-end'}`}>
                          <div
                            className={`text-sm rounded-2xl p-3 leading-relaxed whitespace-pre-wrap break-words ${
                              isAffiliate ? 'bg-slate-100 text-slate-800 rounded-tl-xs' : 'bg-blue-600 text-white rounded-tr-xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {isAffiliate ? selectedAffiliateConversation.fullName : 'You'} · {msg.timestamp}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-[#e5e9f5] flex items-end gap-2">
                  <textarea
                    value={affiliateReplyText}
                    onChange={(e) => setAffiliateReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void handleSendAffiliateReply();
                      }
                    }}
                    placeholder="Reply to this affiliate..."
                    rows={2}
                    className="flex-1 text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-600 resize-none"
                  />
                  <button
                    onClick={() => void handleSendAffiliateReply()}
                    disabled={!affiliateReplyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      ) : dashboardTab === 'affiliates' ? (
        <div className="bg-white border border-[#e5e9f5] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#e5e9f5]">
            <h2 className="font-display text-lg font-bold text-slate-900">Affiliates</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {affiliates.length} affiliate{affiliates.length === 1 ? '' : 's'} registered
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {affiliateActivityFilterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAffiliatesActivityFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    affiliatesActivityFilter === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingAffiliates ? (
              <div className="p-4 text-xs text-slate-400">Loading...</div>
            ) : filteredAffiliates.length === 0 ? (
              <div className="p-4 text-xs text-slate-400">No affiliates match this filter.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3"></th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Referral Code</th>
                    <th className="px-4 py-3 text-right">Leads</th>
                    <th className="px-4 py-3 text-right">Deals Closed</th>
                    <th className="px-4 py-3 text-right">Deal Value</th>
                    <th className="px-4 py-3 text-right">Commission Owed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliates.map((a) => {
                    const isExpanded = expandedAffiliateId === a.affiliateId;
                    const clientsForAffiliate = referredClients.filter((c) => c.affiliateId === a.affiliateId);
                    return (
                      <React.Fragment key={a.affiliateId}>
                        <tr
                          onClick={() => setExpandedAffiliateId(isExpanded ? null : a.affiliateId)}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{a.fullName}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.email}</td>
                          <td className="px-4 py-3 text-slate-600">{a.age ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.country || '—'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.referralCode}</td>
                          <td className="px-4 py-3 text-right flex items-center justify-end gap-1 text-slate-700">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            {a.leadsCount}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">{a.dealsClosed}</td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            ${a.totalDealValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600 flex items-center justify-end gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {a.commissionOwed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={10} className="px-4 py-4">
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                                  <span>
                                    Total earned:{' '}
                                    <span className="font-semibold text-slate-900">
                                      ${a.totalCommissionEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                  </span>
                                  <span>
                                    Paid out so far:{' '}
                                    <span className="font-semibold text-slate-900">
                                      ${a.paidOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                  </span>
                                </div>
                                {confirmPayoutAffiliateId === a.affiliateId ? (
                                  <div className="flex items-center gap-2 text-xs font-semibold">
                                    <span className="text-slate-700">
                                      Mark ${a.commissionOwed.toLocaleString(undefined, { maximumFractionDigits: 0 })} as paid?
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleMarkAffiliatePaid(a.affiliateId, a.totalCommissionEarned);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmPayoutAffiliateId(null);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmPayoutAffiliateId(a.affiliateId);
                                    }}
                                    disabled={a.commissionOwed <= 0}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Mark Commission as Paid
                                  </button>
                                )}
                              </div>
                              {clientsForAffiliate.length === 0 ? (
                                <p className="text-xs text-slate-400">No referrals yet.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                        <th className="px-3 py-2">Client</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2 text-right">Deal Value</th>
                                        <th className="px-3 py-2 text-right">Commission Contribution</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {clientsForAffiliate.map((c) => (
                                        <tr key={c.userId} className="border-b border-slate-200/70 last:border-0">
                                          <td className="px-3 py-2">
                                            <div className="font-semibold text-slate-800">{c.fullName}</div>
                                            {c.organization && <div className="text-[10px] text-slate-400">{c.organization}</div>}
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_STYLES[c.status]}`}>
                                              {STATUS_LABELS[c.status]}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-right text-slate-700">
                                            {c.dealValue != null ? `$${c.dealValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                                          </td>
                                          <td className="px-3 py-2 text-right font-semibold text-blue-600">
                                            {c.commissionContribution > 0
                                              ? `$${c.commissionContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                              : '—'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
      <div className="flex-1 w-full flex flex-col lg:flex-row gap-6 min-h-[640px]">
      {/* Conversation list */}
      <aside className="w-full lg:w-[340px] shrink-0 bg-white border border-[#e5e9f5] rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#e5e9f5]">
          <h2 className="font-display text-lg font-bold text-slate-900">Client Chats</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread === 1 ? '' : 's'}` : 'All caught up'}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filter === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll">
          {isLoadingList ? (
            <div className="p-4 text-xs text-slate-400">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-xs text-slate-400">No clients here yet.</div>
          ) : (
            filteredConversations.map((c) => (
              <button
                key={c.userId}
                onClick={() => void openConversation(c.userId)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedId === c.userId ? 'bg-blue-50/60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 truncate">{c.fullName}</span>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_STYLES[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                  {c.organization && <span className="text-[11px] text-slate-400 truncate">{c.organization}</span>}
                </div>
                <div className="mt-1">
                  {c.affiliateEmail ? (
                    <span className="text-[10px] font-semibold text-blue-600 truncate block">
                      via affiliate: {c.affiliateEmail}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Direct signup</span>
                  )}
                </div>
                {c.lastMessage && <p className="text-xs text-slate-500 mt-1 truncate">{c.lastMessage}</p>}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Conversation thread + Project Notebook stacked */}
      <div className="flex-1 flex flex-col min-w-0 gap-6">
      <main className="flex-1 flex flex-col min-w-0 bg-white border border-[#e5e9f5] rounded-2xl shadow-sm overflow-hidden min-h-[640px]">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Pick a conversation on the left to start replying.
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-[#e5e9f5] flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">{selectedConversation.fullName}</h3>
                <p className="text-xs text-slate-500">{selectedConversation.organization || 'No organization given'}</p>
                <p className="text-xs mt-0.5">
                  {selectedConversation.affiliateEmail ? (
                    <span className="text-blue-600 font-medium">Referred by {selectedConversation.affiliateEmail}</span>
                  ) : (
                    <span className="text-slate-400">Direct signup</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">$</span>
                  <input
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    onBlur={() => void handleSaveDealValue()}
                    placeholder="Deal value"
                    inputMode="decimal"
                    className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 font-semibold"
                    title="Used to calculate affiliate commission when this client is marked Paid"
                  />
                </div>
                <select
                  value={selectedConversation.status}
                  onChange={(e) => void handleStatusChange(e.target.value as ClientStatus)}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer"
                >
                  <option value="new_client">New Client</option>
                  <option value="interested">Interested</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div ref={chatStreamRef} className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scroll flex flex-col gap-3 bg-[#fbfcfe]">
              {isLoadingThread ? (
                <div className="text-xs text-slate-400">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="text-xs text-slate-400">No messages yet.</div>
              ) : (
                messages.map((msg) => {
                  if (msg.sender === 'system') {
                    return (
                      <div
                        key={msg.id}
                        className="bg-white border border-slate-200 text-slate-600 text-xs rounded-xl p-3 self-start max-w-[85%]"
                      >
                        {msg.text}
                      </div>
                    );
                  }
                  const isClient = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isClient ? 'self-start' : 'self-end items-end'}`}>
                      <div
                        className={`text-sm rounded-2xl p-3 leading-relaxed whitespace-pre-wrap break-words ${
                          isClient ? 'bg-slate-100 text-slate-800 rounded-tl-xs' : 'bg-blue-600 text-white rounded-tr-xs'
                        }`}
                      >
                        {msg.text}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-black/10 flex flex-col gap-1">
                            {msg.attachments.map((att, i) => (
                              att.path ? (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => void downloadSpecFile(att.path!, att.name)}
                                  className="text-[11px] font-mono opacity-80 hover:opacity-100 underline decoration-dotted flex items-center gap-1.5 cursor-pointer text-left"
                                >
                                  <Download className="w-3 h-3 shrink-0" />
                                  {att.name}
                                </button>
                              ) : (
                                <div key={i} className="text-[11px] font-mono opacity-80">
                                  {att.name}
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isClient ? selectedConversation.fullName : 'You'} · {msg.timestamp}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-[#e5e9f5] flex items-end gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void handleSendReply();
                  }
                }}
                placeholder="Reply to this client..."
                rows={2}
                className="flex-1 text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-600 resize-none"
              />
              <button
                onClick={() => void handleSendReply()}
                disabled={!replyText.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </>
        )}
      </main>

      {selectedConversation && selectedId && (
        <ProjectNotebook clientUserId={selectedId} viewerLabel="Alexis Cervantes" />
      )}
      </div>
    </div>
      )}
    </div>
  );
};
