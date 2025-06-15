
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CapturedItem, CreateCapturedItemInput, ContentType } from '../../../server/src/schema';

interface CaptureFormProps {
  onItemCreated: (item: CapturedItem) => void;
}

export function CaptureForm({ onItemCreated }: CaptureFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<CreateCapturedItemInput>({
    content_type: 'text',
    content: '',
    title: '',
    description: '',
    metadata: {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createCapturedItem.mutate({
        ...formData,
        title: formData.title || undefined,
        description: formData.description || undefined,
        metadata: Object.keys(formData.metadata || {}).length > 0 ? formData.metadata : undefined
      });
      
      onItemCreated(response);
      
      // Reset form
      setFormData({
        content_type: 'text',
        content: '',
        title: '',
        description: '',
        metadata: {}
      });
      setSuggestedTags([]);
      
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTags = async () => {
    if (!formData.content.trim()) return;
    
    setIsGeneratingTags(true);
    try {
      const tags = await trpc.generateTags.mutate({
        content: formData.content,
        content_type: formData.content_type,
        title: formData.title || undefined,
        description: formData.description || undefined
      });
      setSuggestedTags(tags);
    } catch (error) {
      console.error('Failed to generate tags:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const getContentTypeHelp = (type: ContentType) => {
    switch (type) {
      case 'text':
        return 'Enter your text content, notes, or ideas';
      case 'code':
        return 'Paste code snippets, functions, or scripts';
      case 'image':
        return 'Enter image URL or upload path';
      case 'link':
        return 'Enter the URL you want to save';
      default:
        return '';
    }
  };

  const getContentPlaceholder = (type: ContentType) => {
    switch (type) {
      case 'text':
        return 'Enter your text or notes here...';
      case 'code':
        return 'function example() {\n  // Your code here\n}';
      case 'image':
        return 'https://example.com/image.jpg';
      case 'link':
        return 'https://example.com';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Content Type Selection */}
      <div className="space-y-2">
        <Label>Content Type</Label>
        <Select 
          value={formData.content_type || 'text'} 
          onValueChange={(value: string) => 
            setFormData((prev: CreateCapturedItemInput) => ({ ...prev, content_type: value as ContentType }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">📝 Text</SelectItem>
            <SelectItem value="code">💻 Code</SelectItem>
            <SelectItem value="image">🖼️ Image</SelectItem>
            <SelectItem value="link">🔗 Link</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">{getContentTypeHelp(formData.content_type)}</p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Title (Optional)</Label>
        <Input
          placeholder="Give your capture a title..."
          value={formData.title || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCapturedItemInput) => ({ ...prev, title: e.target.value || '' }))
          }
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Content *</Label>
        <Textarea
          placeholder={getContentPlaceholder(formData.content_type)}
          value={formData.content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateCapturedItemInput) => ({ ...prev, content: e.target.value }))
          }
          className="min-h-24"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description (Optional)</Label>
        <Textarea
          placeholder="Add additional context or description..."
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateCapturedItemInput) => ({ ...prev, description: e.target.value || '' }))
          }
          className="min-h-16"
        />
      </div>

      {/* AI Tag Generation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>AI-Generated Tags</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateTags}
            disabled={!formData.content.trim() || isGeneratingTags}
          >
            {isGeneratingTags ? '🤖 Generating...' : '✨ Generate Tags'}
          </Button>
        </div>
        
        {suggestedTags.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-600 mb-2">Suggested tags:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview for Images and Links */}
      {(formData.content_type === 'image' || formData.content_type === 'link') && formData.content && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <Card>
            <CardContent className="pt-4">
              {formData.content_type === 'image' ? (
                <img 
                  src={formData.content} 
                  alt="Preview" 
                  className="max-w-full h-32 object-contain rounded"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-sm text-blue-600 hover:underline">
                  🔗 {formData.content}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button 
          type="submit" 
          disabled={isLoading || !formData.content.trim()}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isLoading ? '💾 Saving...' : '✨ Capture Item'}
        </Button>
      </div>
    </form>
  );
}
