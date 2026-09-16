import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface ClientOnboardingModalProps {
  user: UserProfile;
  onComplete: (updated: Partial<UserProfile>) => void;
}

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({ user, onComplete }) => {
  const [fullName, setFullName] = useState(user.name.includes('@') ? '' : user.name);
  const [country, setCountry] = useState('');
  const [organization, setOrganization] = useState(user.organization ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !country.trim()) {
      setError('Please fill in your name and country.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        country: country.trim(),
        organization: organization.trim() || null
      })
      .eq('id', user.id);

    setIsSubmitting(false);

    if (updateError) {
      setError('Something went wrong saving your details. Please try again.');
      return;
    }

    onComplete({
      name: fullName.trim(),
      country: country.trim(),
      organization: organization.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 my-8">
        <div className="text-center max-w-lg mx-auto mb-8">
          <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
            A couple quick details
          </h2>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            Tell us who you are before we head into the Discussion Desk.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5" htmlFor="onboarding-name">
              Full Name
            </label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
              id="onboarding-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Marcus Vance"
              required
              type="text"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5" htmlFor="onboarding-country">
              Country
            </label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
              id="onboarding-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="United States"
              required
              type="text"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5" htmlFor="onboarding-company">
              Company Name <span className="normal-case text-slate-400 font-medium">(optional)</span>
            </label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
              id="onboarding-company"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Northline Logistics"
              type="text"
            />
          </div>

          <div className="pt-2">
            <button
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md text-sm cursor-pointer disabled:opacity-75"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Saving...' : 'Continue to Discussion Desk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
