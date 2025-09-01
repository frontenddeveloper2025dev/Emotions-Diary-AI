import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDiaryStore, DiaryEntry } from '@/store/diary-store';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { DiaryEditor } from '@/components/diary/DiaryEditor';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Plus, 
  BookOpen, 
  ArrowLeft,
  Filter,
  SortDesc,
  Edit,
  MessageCircle,
  Brain
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

function EntriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mood'>('newest');
  const navigate = useNavigate();
  
  const { 
    entries, 
    isLoading, 
    isAnalyzing,
    error, 
    loadEntries, 
    deleteEntry, 
    searchEntries,
    analyzeEntry,
    reanalyzeEntry,
    clearError 
  } = useDiaryStore();
  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Filter and sort entries
  const filteredAndSortedEntries = React.useMemo(() => {
    let filtered = entries;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(entry => entry.date === dateFilter);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'mood':
          return (b.sentiment || 0) - (a.sentiment || 0);
        case 'newest':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [entries, searchTerm, dateFilter, sortBy]);

  const handleNewEntry = () => {
    setEditingEntry(null);
    setIsEditorOpen(true);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setIsEditorOpen(true);
  };

  const handleViewEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      toast({
        title: 'Entry deleted',
        description: 'Your diary entry has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleAnalyzeEntry = async (entryId: string) => {
    try {
      const entry = entries.find(e => e._id === entryId);
      if (!entry) return;

      if (entry.mood) {
        await reanalyzeEntry(entryId);
        toast({
          title: 'Entry re-analyzed',
          description: 'Your diary entry emotions have been re-analyzed with fresh insights',
        });
      } else {
        await analyzeEntry(entryId);
        toast({
          title: 'Entry analyzed',
          description: 'Your diary entry has been analyzed for emotions and insights',
        });
      }
    } catch (error) {
      console.error('Error analyzing entry:', error);
      toast({
        title: 'Analysis failed',
        description: 'Failed to analyze entry emotions. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditorSave = () => {
    setIsEditorOpen(false);
    setEditingEntry(null);
    loadEntries(); // Refresh entries
  };

  const handleEditorCancel = () => {
    setIsEditorOpen(false);
    setEditingEntry(null);
  };

  const getTotalStats = () => {
    const totalWords = entries.reduce((sum, entry) => sum + entry.wordCount, 0);
    const avgMood = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + (entry.sentiment || 0), 0) / entries.length 
      : 0;
    
    return { totalWords, avgMood };
  };

  const { totalWords, avgMood } = getTotalStats();

  if (isLoading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p>Loading your diary entries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-accent" />
                My Diary Entries
              </h1>
              <p className="text-muted-foreground mt-1">
                {entries.length} entries • {totalWords.toLocaleString()} words written
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/chat')}
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Luna
            </Button>
            <Button onClick={handleNewEntry}>
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="gentle-shadow">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>
          
          <Card className="gentle-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">
                {avgMood > 0.5 ? '😊' : avgMood > 0 ? '😌' : avgMood > -0.3 ? '😔' : '😢'}
              </div>
              <p className="text-2xl font-bold">{Math.round(avgMood * 100)}%</p>
              <p className="text-sm text-muted-foreground">Average Mood</p>
            </CardContent>
          </Card>
          
          <Card className="gentle-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 mx-auto mb-2 text-blue-500">📝</div>
              <p className="text-2xl font-bold">{totalWords.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Words Written</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="gentle-shadow mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search entries by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-auto"
                />
                {dateFilter && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDateFilter('')}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <SortDesc className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="mood">By Mood</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || dateFilter) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {dateFilter && (
                  <Badge variant="secondary">
                    Date: {new Date(dateFilter).toLocaleDateString()}
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('');
                  }}
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entries List */}
        {filteredAndSortedEntries.length === 0 ? (
          <Card className="gentle-shadow">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">
                {entries.length === 0 
                  ? 'No diary entries yet' 
                  : 'No entries match your filters'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {entries.length === 0 
                  ? 'Start your journaling journey by writing your first entry' 
                  : 'Try adjusting your search or filters to find more entries'
                }
              </p>
              {entries.length === 0 && (
                <Button onClick={handleNewEntry}>
                  <Plus className="w-4 h-4 mr-2" />
                  Write First Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedEntries.map((entry) => (
              <DiaryEntryCard
                key={entry._id}
                entry={entry}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onAnalyze={handleAnalyzeEntry}
                onClick={handleViewEntry}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Entry' : 'New Diary Entry'}
            </DialogTitle>
          </DialogHeader>
          <DiaryEditor
            entry={editingEntry}
            onSave={handleEditorSave}
            onCancel={handleEditorCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Entry Viewer Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedEntry.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {new Date(selectedEntry.date).toLocaleDateString()}
                    </Badge>
                    {selectedEntry.mood !== undefined && (
                      <Badge variant="secondary" className={`${
                        selectedEntry.mood > 0.5 ? 'text-green-600 bg-green-50' :
                        selectedEntry.mood > 0 ? 'text-yellow-600 bg-yellow-50' :
                        'text-red-600 bg-red-50'
                      }`}>
                        {selectedEntry.mood > 0.7 ? '😊' : 
                         selectedEntry.mood > 0.3 ? '😌' :
                         selectedEntry.mood > 0 ? '😐' :
                         selectedEntry.mood > -0.3 ? '😔' : '😢'} 
                        {Math.round(selectedEntry.mood * 100)}%
                      </Badge>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedEntry.imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={selectedEntry.imageUrl} 
                      alt="Entry attachment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedEntry.content}
                  </p>
                </div>
                {selectedEntry.emotions && selectedEntry.emotions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {selectedEntry.emotions.map((emotion) => (
                      <Badge key={emotion} variant="outline">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => handleEditEntry(selectedEntry)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Entry
                  </Button>
                  <Button onClick={() => setSelectedEntry(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EntriesPage;