import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiaryEntry } from '@/store/diary-store';
import { Calendar, Clock, Camera, MoreHorizontal, Edit, Trash2, Brain, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DiaryEntryCardProps {
  entry: DiaryEntry;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (entryId: string) => void;
  onAnalyze?: (entryId: string) => void;
  onClick?: (entry: DiaryEntry) => void;
}

export function DiaryEntryCard({ entry, onEdit, onDelete, onAnalyze, onClick }: DiaryEntryCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getMoodColor = (sentiment?: number) => {
    if (sentiment === undefined) return 'text-muted-foreground bg-muted';
    if (sentiment > 0.5) return 'text-green-600 bg-green-50 border-green-200';
    if (sentiment > 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMoodEmoji = (mood?: string, sentiment?: number) => {
    if (!mood) return '😐';
    
    // Map mood strings to emojis with sentiment consideration
    const moodEmojis: { [key: string]: string } = {
      happy: '😊',
      joyful: '😄',
      excited: '🤗',
      peaceful: '😌',
      content: '😊',
      grateful: '🙏',
      proud: '😌',
      loved: '🥰',
      optimistic: '😊',
      confident: '😌',
      sad: '😢',
      disappointed: '😔',
      lonely: '😞',
      hurt: '💔',
      heartbroken: '💔',
      grief: '😢',
      melancholy: '😔',
      anxious: '😰',
      worried: '😟',
      stressed: '😣',
      overwhelmed: '😵',
      nervous: '😬',
      fearful: '😨',
      angry: '😠',
      frustrated: '😤',
      irritated: '😒',
      annoyed: '😑',
      upset: '😠',
      neutral: '😐',
      calm: '😌',
      tired: '😴',
      bored: '😐',
      confused: '🤔',
      surprised: '😲',
      shocked: '😱',
      amazed: '😲'
    };
    
    return moodEmojis[mood.toLowerCase()] || '😐';
  };

  const getSentimentLabel = (sentiment?: number) => {
    if (sentiment === undefined) return 'Unknown';
    if (sentiment > 0.6) return 'Very Positive';
    if (sentiment > 0.2) return 'Positive';
    if (sentiment > -0.2) return 'Neutral';
    if (sentiment > -0.6) return 'Negative';
    return 'Very Negative';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreview = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(entry);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(entry);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(entry._id);
    setShowDeleteDialog(false);
  };

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAnalyze?.(entry._id);
  };

  return (
    <>
      <Card 
        className="gentle-shadow hover:shadow-md transition-all duration-200 cursor-pointer group"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-lg leading-tight truncate group-hover:text-accent transition-colors">
                {entry.title || 'Untitled Entry'}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(entry.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(entry.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {entry.mood && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getMoodColor(entry.sentiment)}`}
                >
                  {getMoodEmoji(entry.mood, entry.sentiment)} {entry.mood}
                </Badge>
              )}
              {entry.sentiment !== undefined && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  {getSentimentLabel(entry.sentiment)}
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Entry
                  </DropdownMenuItem>
                  {onAnalyze && (
                    <DropdownMenuItem onClick={handleAnalyze}>
                      <Brain className="w-4 h-4 mr-2" />
                      {entry.mood ? 'Re-analyze' : 'Analyze'} Emotions
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Entry
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Image Preview */}
          {entry.imageUrl && (
            <div className="mb-3">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img 
                  src={entry.imageUrl} 
                  alt="Entry attachment"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <Camera className="w-3 h-3 mr-1" />
                    Photo
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Content Preview */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {getPreview(entry.content)}
          </p>

          {/* AI Summary */}
          {entry.emotionSummary && (
            <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-rose-700 leading-relaxed">
                  {entry.emotionSummary}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {entry.emotions && entry.emotions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.emotions.slice(0, 3).map((emotion, index) => (
                    <Badge key={`${emotion}-${index}`} variant="outline" className="text-xs">
                      {emotion}
                    </Badge>
                  ))}
                  {entry.emotions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{entry.emotions.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              {entry.tags && entry.tags.length > 0 && entry.emotions && entry.emotions.length > 0 && (
                <span className="text-muted-foreground">•</span>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {entry.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{entry.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              {entry.wordCount} words
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{entry.title || 'this entry'}"? 
              This action cannot be undone and will permanently remove your diary entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}