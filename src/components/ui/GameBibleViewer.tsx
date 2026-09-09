import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Cpu, 
  Mic2, 
  Scroll, 
  ShieldCheck 
} from 'lucide-react';
import { STUDIO_DOCUMENTATION, StudioDocSection, GAME_TITLE, GAME_TAGLINE } from '../../data/gameBible';

interface GameBibleViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_TABS: { id: StudioDocSection['category'] | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All Sections', icon: Layers },
  { id: 'game_bible', label: 'Game Bible', icon: BookOpen },
  { id: 'character_bible', label: 'Character Bible', icon: ShieldCheck },
  { id: 'story_bible', label: 'Story & Narrative', icon: Scroll },
  { id: 'voice_bible', label: 'Voice Acting Bible', icon: Mic2 },
  { id: 'gdd', label: 'Gameplay GDD', icon: CheckCircle2 },
  { id: 'tdd', label: 'Technical TDD', icon: Cpu },
];

export const GameBibleViewer: React.FC<GameBibleViewerProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<StudioDocSection['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>(STUDIO_DOCUMENTATION[0].id);

  if (!isOpen) return null;

  const filteredSections = STUDIO_DOCUMENTATION.filter(sec => {
    const matchesCat = selectedCategory === 'all' || sec.category === selectedCategory;
    const matchesSearch = 
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeSection = STUDIO_DOCUMENTATION.find(s => s.id === activeSectionId) || filteredSections[0] || STUDIO_DOCUMENTATION[0];

  const getStatusBadge = (status: StudioDocSection['status']) => {
    switch (status) {
      case '[IMPLEMENTED]':
        return <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded font-mono">[IMPLEMENTED]</span>;
      case '[PLANNED]':
        return <span className="bg-sky-950/80 text-sky-400 border border-sky-500/40 text-[10px] font-bold px-2 py-0.5 rounded font-mono">[PLANNED]</span>;
      case '[ASSET REQUIRED]':
        return <span className="bg-amber-950/80 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded font-mono">[ASSET REQUIRED]</span>;
      case '[INFRASTRUCTURE REQUIRED]':
        return <span className="bg-purple-950/80 text-purple-400 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded font-mono">[INFRASTRUCTURE REQUIRED]</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[90vh] bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-neutral-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-amber-400 tracking-wide">
                  {GAME_TITLE}
                </h2>
                <span className="text-[10px] bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded font-mono text-neutral-300">
                  STUDIO ARCHIVE v1.0
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 italic">
                "{GAME_TAGLINE}" | Official Master Game Bible, Character Bible, Story, GDD & TDD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {CATEGORY_TABS.map(tab => {
              const Icon = tab.icon;
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search lore, mechanics, bibles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 2-COLUMN VIEW: SECTION LIST & ARTICLE VIEWER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Sidebar Section List */}
          <div className="md:col-span-4 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800 overflow-y-auto flex flex-col gap-2">
            {filteredSections.map(sec => {
              const isSelected = activeSection.id === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 shadow-md'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
                      {sec.category.replace('_', ' ')}
                    </span>
                    {getStatusBadge(sec.status)}
                  </div>
                  <h4 className="font-display font-bold text-xs text-neutral-200">{sec.title}</h4>
                </button>
              );
            })}
            {filteredSections.length === 0 && (
              <div className="text-xs text-neutral-500 text-center py-6">
                No matching studio documents found.
              </div>
            )}
          </div>

          {/* Document Content View */}
          <div className="md:col-span-8 bg-neutral-900/30 p-6 rounded-xl border border-neutral-800 overflow-y-auto flex flex-col gap-4">
            <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  {activeSection.category.replace('_', ' ')}
                </span>
                <h3 className="font-display text-xl font-bold text-neutral-100 mt-1">
                  {activeSection.title}
                </h3>
              </div>
              {getStatusBadge(activeSection.status)}
            </div>

            <div className="text-xs text-neutral-300 leading-relaxed space-y-3 whitespace-pre-line font-sans">
              {activeSection.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
