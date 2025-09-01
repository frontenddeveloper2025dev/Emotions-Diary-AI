import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DiaryEntry, useDiaryStore } from '@/store/diary-store';
import { ImageUpload } from './ImageUpload';
import { Save, X, Edit, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiaryEditorProps {
  entry?: DiaryEntry | null;
  selectedDate?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export function DiaryEditor({ entry, selectedDate, onSave, onCancel }: DiaryEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const { addEntry, updateEntry, isLoading, error, clearError } = useDiaryStore();
  const { toast } = useToast();

  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setDate(entry.date);
      setImageUrl(entry.imageUrl || '');
    } else {
      // Reset for new entry
      setTitle('');
      setContent('');
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setImageUrl('');
    }
  }, [entry, selectedDate]);

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

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please write something in your diary entry',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing && entry) {
        await updateEntry(entry._id, {
          title: title.trim() || 'Untitled Entry',
          content: content.trim(),
          date,
          imageUrl: imageUrl || undefined,
        });
        toast({
          title: 'Entry updated',
          description: 'Your diary entry has been saved successfully',
        });
      } else {
        await addEntry({
          title: title.trim() || 'Untitled Entry',
          content: content.trim(),
          date,
          imageUrl: imageUrl || undefined,
          wordCount: content.trim().split(/\s+/).length,
        });
        toast({
          title: 'Entry saved',
          description: 'Your diary entry has been saved successfully',
        });
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
      setImageUrl('');
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <Card className="gentle-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit className="w-5 h-5" />
                  Edit Entry
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  New Entry
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update your thoughts and feelings'
                : 'Share your thoughts, feelings, and experiences today'
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="entry-date" className="text-sm font-medium">Date:</Label>
            <Input
              id="entry-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Title Input */}
        <div>
          <Label htmlFor="entry-title">Title (optional)</Label>
          <Input
            id="entry-title"
            placeholder="What's on your mind today?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
            maxLength={100}
          />
        </div>
        
        {/* Content Textarea */}
        <div>
          <Label htmlFor="entry-content">Your thoughts</Label>
          <Textarea
            id="entry-content"
            placeholder="Dear diary... How are you feeling today? What happened? What are you grateful for?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 min-h-[250px] writing-focus resize-none"
            rows={10}
          />
        </div>
        
        {/* Image Upload */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Photo Attachment</Label>
          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
            onImageRemoved={() => setImageUrl('')}
            disabled={isLoading}
          />
        </div>
        
        {/* Footer with Stats and Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{content.length} characters</span>
            <span>•</span>
            <span>{wordCount} words</span>
            <span>•</span>
            <span>~{readingTime} min read</span>
          </div>
          
          <div className="flex gap-2">
            {(onCancel || isEditing) && (
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={!content.trim() || isLoading}
            >
              <Save className="w-4 h-4 mr-1" />
              {isLoading ? 'Saving...' : isEditing ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}