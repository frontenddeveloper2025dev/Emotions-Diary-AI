import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { useDiaryStore } from '@/store/diary-store';
import { DiaryEditor } from '@/components/diary/DiaryEditor';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { Heart, Plus, BookOpen, TrendingUp, MessageCircle, Settings, Calendar, Search, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const { user, logout } = useAuthStore();
  const { entries, loadEntries, deleteEntry } = useDiaryStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showEditor, setShowEditor] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNewEntry = () => {
    setShowEditor(true);
  };

  const handleEditorSave = () => {
    setShowEditor(false);
    loadEntries(); // Refresh entries
  };

  const handleViewAllEntries = () => {
    navigate('/entries');
  };

  // Get recent entries (last 3)
  const recentEntries = entries
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  // Calculate stats
  const totalEntries = entries.length;
  const totalWords = entries.reduce((sum, entry) => sum + entry.wordCount, 0);
  const avgMood = entries.length > 0 
    ? entries.reduce((sum, entry) => sum + (entry.mood || 0), 0) / entries.length 
    : 0;
  const currentStreak = 7; // TODO: Calculate actual streak

  const getMoodColor = (score: number) => {
    if (score > 0.5) return 'text-green-600 bg-green-50';
    if (score > 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMoodEmoji = (score: number) => {
    if (score > 0.7) return '😊';
    if (score > 0.3) return '😌';
    if (score > 0) return '😐';
    if (score > -0.3) return '😔';
    return '😢';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Smart AI Diary</h1>
              <p className="text-xs text-muted-foreground">Welcome back, {user?.name || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Writing Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="gentle-shadow">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold">{totalEntries}</p>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                </CardContent>
              </Card>
              
              <Card className="gentle-shadow">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{currentStreak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </CardContent>
              </Card>
              
              <Card className="gentle-shadow">
                <CardContent className="p-4 text-center">
                  <Heart className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                  <p className="text-2xl font-bold">
                    {avgMood > 0.5 ? '😊' : avgMood > 0 ? '😌' : avgMood > -0.3 ? '😔' : '😢'}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Mood</p>
                </CardContent>
              </Card>
              
              <Card className="gentle-shadow">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
                  </p>
                  <p className="text-sm text-muted-foreground">Words Written</p>
                </CardContent>
              </Card>
            </div>

            {/* New Entry Section */}
            {showEditor ? (
              <DiaryEditor
                selectedDate={selectedDate}
                onSave={handleEditorSave}
                onCancel={() => setShowEditor(false)}
              />
            ) : (
              <Card className="gentle-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Ready to write?</h3>
                    <p className="text-muted-foreground mb-4">
                      Capture your thoughts, feelings, and experiences from today
                    </p>
                    <Button onClick={handleNewEntry} size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Write New Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Chat Teaser */}
            <Card className="gentle-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-accent" />
                  AI Companion
                </CardTitle>
                <CardDescription>
                  Chat about your feelings and get insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-accent/30" />
                  <p className="text-sm">AI companion will be available in Phase 3</p>
                  <p className="text-xs mt-2">Ready to understand your emotions and provide personalized insights</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card className="gentle-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Recent Entries</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleViewAllEntries}>
                  <Search className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm">No entries yet</p>
                    <p className="text-xs mt-1">Start writing to see your recent entries here</p>
                  </div>
                ) : (
                  <>
                    {recentEntries.map((entry) => (
                      <div 
                        key={entry._id} 
                        className="p-3 rounded-lg border bg-card hover:bg-accent/5 cursor-pointer transition-colors"
                        onClick={() => navigate('/entries')}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm truncate">{entry.title}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                            {entry.mood !== undefined && (
                              <Badge variant="secondary" className={`text-xs ${getMoodColor(entry.mood)}`}>
                                {Math.round(entry.mood * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {entry.content.length > 80 ? entry.content.substring(0, 80) + '...' : entry.content}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {entry.emotions?.slice(0, 2).map((emotion) => (
                              <Badge key={emotion} variant="outline" className="text-xs">
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button variant="ghost" className="w-full mt-3 text-sm" onClick={handleViewAllEntries}>
                      <span>View all entries</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Mood Trends Teaser */}
            <Card className="gentle-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Mood Trends
                </CardTitle>
                <CardDescription>
                  Track your emotional patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
                  <p className="text-sm">Charts and insights coming in Phase 4</p>
                  <p className="text-xs mt-2">Visualize your emotional journey with beautiful analytics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage; 