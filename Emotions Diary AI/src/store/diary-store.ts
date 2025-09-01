import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { table } from '@devvai/devv-code-backend';
import { aiService } from '@/services/ai-service';

export interface DiaryEntry {
  _id: string;
  _uid: string;
  title: string;
  content: string;
  date: string;
  createdAt: number;
  updatedAt: number;
  imageUrl?: string;
  mood?: string; // Primary mood (happy, sad, anxious, etc.)
  sentiment?: number; // -1 to 1 scale
  emotions?: string[];
  emotionSummary?: string;
  tags?: string[];
  wordCount: number;
}

interface DiaryState {
  entries: DiaryEntry[];
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  
  // Actions
  addEntry: (entry: Omit<DiaryEntry, '_id' | '_uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (entryId: string, updates: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  loadEntries: () => Promise<void>;
  searchEntries: (searchTerm: string) => Promise<DiaryEntry[]>;
  getEntriesByDateRange: (startDate: string, endDate: string) => Promise<DiaryEntry[]>;
  analyzeEntry: (entryId: string) => Promise<void>;
  reanalyzeEntry: (entryId: string) => Promise<void>;
  clearError: () => void;
}

const TABLE_ID = 'diary_entries';

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoading: false,
      isAnalyzing: false,
      error: null,

      addEntry: async (entryData) => {
        set({ isLoading: true, error: null });
        try {
          const now = Date.now();
          const newEntry = {
            ...entryData,
            createdAt: now,
            updatedAt: now,
            wordCount: entryData.content.trim().split(/\s+/).length,
          };

          await table.addItem(TABLE_ID, newEntry);
          
          // Reload entries to get the server-assigned _id
          await get().loadEntries();

          // Auto-analyze the new entry if it has substantial content
          if (entryData.content && entryData.content.trim().length > 50) {
            const entries = get().entries;
            const addedEntry = entries.find(e => e.content === entryData.content);
            if (addedEntry) {
              // Run analysis in background without waiting
              get().analyzeEntry(addedEntry._id).catch(console.error);
            }
          }
        } catch (error) {
          console.error('Error adding entry:', error);
          set({ error: 'Failed to save diary entry' });
        } finally {
          set({ isLoading: false });
        }
      },

      updateEntry: async (entryId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const { entries } = get();
          const entry = entries.find(e => e._id === entryId);
          if (!entry) {
            throw new Error('Entry not found');
          }

          const updatedEntry = {
            ...entry,
            ...updates,
            updatedAt: Date.now(),
            wordCount: updates.content ? updates.content.trim().split(/\s+/).length : entry.wordCount,
          };

          await table.updateItem(TABLE_ID, updatedEntry);
          
          // Update local state
          set({
            entries: entries.map(e => e._id === entryId ? updatedEntry : e)
          });
        } catch (error) {
          console.error('Error updating entry:', error);
          set({ error: 'Failed to update diary entry' });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteEntry: async (entryId) => {
        set({ isLoading: true, error: null });
        try {
          const { entries } = get();
          const entry = entries.find(e => e._id === entryId);
          if (!entry) {
            throw new Error('Entry not found');
          }

          await table.deleteItem(TABLE_ID, {
            _uid: entry._uid,
            _id: entry._id
          });

          // Update local state
          set({
            entries: entries.filter(e => e._id !== entryId)
          });
        } catch (error) {
          console.error('Error deleting entry:', error);
          set({ error: 'Failed to delete diary entry' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadEntries: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await table.getItems(TABLE_ID, {
            sort: '_id',
            order: 'desc',
            limit: 100
          });

          set({ entries: response.items as DiaryEntry[] });
        } catch (error) {
          console.error('Error loading entries:', error);
          set({ error: 'Failed to load diary entries' });
        } finally {
          set({ isLoading: false });
        }
      },

      searchEntries: async (searchTerm) => {
        set({ isLoading: true, error: null });
        try {
          const response = await table.getItems(TABLE_ID, {
            query: {
              title: {
                operator: 'BEGINS_WITH',
                value: searchTerm
              }
            },
            sort: '_id',
            order: 'desc'
          });

          set({ isLoading: false });
          return response.items as DiaryEntry[];
        } catch (error) {
          console.error('Error searching entries:', error);
          set({ error: 'Failed to search entries', isLoading: false });
          return [];
        }
      },

      getEntriesByDateRange: async (startDate, endDate) => {
        set({ isLoading: true, error: null });
        try {
          const { entries } = get();
          const filtered = entries.filter(entry => {
            return entry.date >= startDate && entry.date <= endDate;
          });

          set({ isLoading: false });
          return filtered.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
          console.error('Error filtering entries by date:', error);
          set({ error: 'Failed to filter entries', isLoading: false });
          return [];
        }
      },

      analyzeEntry: async (entryId) => {
        set({ isAnalyzing: true, error: null });
        try {
          const { entries } = get();
          const entry = entries.find(e => e._id === entryId);
          if (!entry) {
            throw new Error('Entry not found');
          }

          // Skip if already analyzed
          if (entry.mood && entry.sentiment !== undefined) {
            set({ isAnalyzing: false });
            return;
          }

          const analysis = await aiService.analyzeEmotion(entry.content);
          
          const updatedEntry = {
            ...entry,
            mood: analysis.mood,
            sentiment: analysis.sentiment,
            emotions: analysis.emotions,
            emotionSummary: analysis.summary,
            tags: analysis.tags,
            updatedAt: Date.now(),
          };

          await table.updateItem(TABLE_ID, updatedEntry);
          
          // Update local state
          set({
            entries: entries.map(e => e._id === entryId ? updatedEntry : e)
          });
        } catch (error) {
          console.error('Error analyzing entry:', error);
          set({ error: 'Failed to analyze entry emotions' });
        } finally {
          set({ isAnalyzing: false });
        }
      },

      reanalyzeEntry: async (entryId) => {
        set({ isAnalyzing: true, error: null });
        try {
          const { entries } = get();
          const entry = entries.find(e => e._id === entryId);
          if (!entry) {
            throw new Error('Entry not found');
          }

          const analysis = await aiService.analyzeEmotion(entry.content);
          
          const updatedEntry = {
            ...entry,
            mood: analysis.mood,
            sentiment: analysis.sentiment,
            emotions: analysis.emotions,
            emotionSummary: analysis.summary,
            tags: analysis.tags,
            updatedAt: Date.now(),
          };

          await table.updateItem(TABLE_ID, updatedEntry);
          
          // Update local state
          set({
            entries: entries.map(e => e._id === entryId ? updatedEntry : e)
          });
        } catch (error) {
          console.error('Error reanalyzing entry:', error);
          set({ error: 'Failed to reanalyze entry emotions' });
        } finally {
          set({ isAnalyzing: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'diary-storage',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);