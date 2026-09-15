import React, { useState } from 'react';
import { Network, Database, Layers, ArrowRight, Check, Code } from 'lucide-react';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSchema: (schemaName: string, description: string) => void;
}

const TEMPLATES = [
  {
    id: 'relational-sync',
    name: 'PostgreSQL + Automated Webhook Sync',
    description: 'PostgreSQL database with transactional queue, syncing external Shopify/ERP data via authenticated webhooks.',
    flow: ['Operational Client Form', 'Node.js Express API', 'Transactional PostgreSQL', 'Outbound Webhooks']
  },
  {
    id: 'internal-portal',
    name: 'Role-Based Ops Portal Architecture',
    description: 'React client with JWT auth, role-based dashboards (Admin, Manager, Dispatcher) and audited action logs.',
    flow: ['Staff Auth Portal', 'Access Gateway', 'Business Logic Services', 'Audited Storage']
  },
  {
    id: 'legacy-migration',
    name: 'Legacy Database ETL Pipeline',
    description: 'Scheduled batch extraction from legacy on-prem database into clean cloud schema with rollback protection.',
    flow: ['Legacy SQL Data Source', 'Validation & Sanitizer', 'Staging Schema', 'Production Cluster']
  }
];

export const SchemaModal: React.FC<SchemaModalProps> = ({
  isOpen,
  onClose,
  onInsertSchema
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Architecture Diagram Sketch</h3>
              <p className="text-xs text-slate-500">Pick a reference blueprint to share with Alexis Cervantes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1">
            ✕
          </button>
        </div>

        <div className="py-4 flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Blueprint Pattern:
          </label>
          <div className="flex flex-col gap-2.5">
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {tmpl.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                    {tmpl.flow.map((node, i) => (
                      <React.Fragment key={i}>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {node}
                        </span>
                        {i < tmpl.flow.length - 1 && (
                          <span className="text-[10px] text-slate-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onInsertSchema(selectedTemplate.name, selectedTemplate.description);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insert Into Brief</span>
          </button>
        </div>
      </div>
    </div>
  );
};
