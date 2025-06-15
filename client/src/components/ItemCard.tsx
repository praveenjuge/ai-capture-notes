
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CapturedItem, UpdateCapturedItemInput, ContentType } from '../../../server/src/schema';

interface ItemCardProps {
  item: CapturedItem;
  onUpdate: (item: CapturedItem) => void;
  onDelete: (id: number) => void;
}

export function ItemCard({ item, onUpdate, onDelete }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<UpdateCapturedItemInput>({
    id: item.id,
    content_type: item.content_type,
    content: item.content,
    title: item.title,
    description: item.description,
    tags: [...item.tags]
  });

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'text': return '📝';
      case 'code': return '💻';
      case 'image': return '🖼️';
      case 'link': return '🔗';
      default: return '📄';
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await trpc.updateCapturedItem.mutate(editData);
      onUpdate(response);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await trpc.deleteCapturedItem.mutate(item.id);
      onDelete(item.id);
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatContent = (content: string, type: ContentType) => {
    if (type === 'code') {
      return (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          <code>{content}</code>
        </pre>
      );
    }
    
    if (type === 'link') {
      return (
        <a 
          href={content} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {content}
        </a>
      );
    }
    
    if (type === 'image') {
      return (
        <div className="space-y-2">
          <img 
            src={content} 
            alt={item.title || 'Captured image'} 
            className="w-full h-32 object-cover rounded"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <p className="text-xs text-gray-500 break-all">{content}</p>
        </div>
      );
    }
    
    return <p className="text-sm text-gray-700 line-clamp-3">{content}</p>;
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !editData.tags?.includes(tag.trim())) {
      setEditData((prev: UpdateCapturedItemInput) => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditData((prev: UpdateCapturedItemInput) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag: string) => tag !== tagToRemove)
    }));
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getContentTypeIcon(item.content_type)}</span>
            <div>
              {item.title ? (
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              ) : (
                <CardTitle className="text-sm font-medium text-gray-500">
                  {item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)}
                </CardTitle>
              )}
              <p className="text-xs text-gray-500">
                {item.created_at.toLocaleDateString()} • {item.created_at.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  ✏️
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Item</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select 
                      value={editData.content_type || 'text'} 
                      onValueChange={(value: string) => 
                        setEditData((prev: UpdateCapturedItemInput) => ({ 
                          ...prev, 
                          content_type: value as ContentType 
                        }))
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
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editData.title || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditData((prev: UpdateCapturedItemInput) => ({ 
                          ...prev, 
                          title: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={editData.content || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditData((prev: UpdateCapturedItemInput) => ({ 
                          ...prev, 
                          content: e.target.value 
                        }))
                      }
                      className="min-h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditData((prev: UpdateCapturedItemInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      className="min-h-16"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editData.tags?.map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add tag and press Enter"
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          addTag(target.value);
                          target.value = '';
                        }
                      }}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                  🗑️
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this item? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Content */}
        <div>{formatContent(item.content, item.content_type)}</div>
        
        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-600 italic">{item.description}</p>
        )}
        
        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Metadata */}
        {item.metadata && Object.keys(item.metadata).length > 0 && (
          <details className="text-xs">
            <summary className="text-gray-500 cursor-pointer">Metadata</summary>
            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded">
              {JSON.stringify(item.metadata, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
