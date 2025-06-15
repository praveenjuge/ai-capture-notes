
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { CaptureForm } from '@/components/CaptureForm';
import { ItemCard } from '@/components/ItemCard';
import { VisualBoard } from '@/components/VisualBoard';
import { SemanticSearch } from '@/components/SemanticSearch';
import type { CapturedItem, ContentType, Tag } from '../../server/src/schema';

function App() {
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<CapturedItem[]>([]);

  const loadItems = useCallback(async () => {
    try {
      const result = await trpc.getCapturedItems.query();
      setItems(result);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const result = await trpc.getAllTags.query();
      setTags(result);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadTags();
  }, [loadItems, loadTags]);

  // Filter items based on selected filters
  useEffect(() => {
    let filtered = [...items];

    // Filter by content type
    if (selectedContentType !== 'all') {
      filtered = filtered.filter((item: CapturedItem) => item.content_type === selectedContentType);
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item: CapturedItem) =>
        selectedTags.every((tag: string) => item.tags.includes(tag))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: CapturedItem) =>
        item.content.toLowerCase().includes(query) ||
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredItems(filtered);
  }, [items, selectedContentType, selectedTags, searchQuery]);

  const handleItemCreated = useCallback(async (newItem: CapturedItem) => {
    setItems((prev: CapturedItem[]) => [newItem, ...prev]);
    await loadTags(); // Refresh tags after creating new item
  }, [loadTags]);

  const handleItemUpdated = useCallback(async (updatedItem: CapturedItem) => {
    setItems((prev: CapturedItem[]) =>
      prev.map((item: CapturedItem) => item.id === updatedItem.id ? updatedItem : item)
    );
    await loadTags(); // Refresh tags after updating item
  }, [loadTags]);

  const handleItemDeleted = useCallback(async (deletedId: number) => {
    setItems((prev: CapturedItem[]) =>
      prev.filter((item: CapturedItem) => item.id !== deletedId)
    );
    await loadTags(); // Refresh tags after deleting item
  }, [loadTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev: string[]) =>
      prev.includes(tag) ? prev.filter((t: string) => t !== tag) : [...prev, tag]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedContentType('all');
    setSelectedTags([]);
    setSearchQuery('');
  }, []);

  const getItemsByContentType = (type: ContentType) => {
    return filteredItems.filter((item: CapturedItem) => item.content_type === type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🎯 Capture & Organize
          </h1>
          <p className="text-gray-600">AI-powered note and visual capture tool</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <Input
              placeholder="🔍 Search items..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-64"
            />

            {/* Content Type Filter */}
            <Select value={selectedContentType} onValueChange={(value: string) => setSelectedContentType(value as ContentType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="text">📝 Text</SelectItem>
                <SelectItem value="code">💻 Code</SelectItem>
                <SelectItem value="image">🖼️ Image</SelectItem>
                <SelectItem value="link">🔗 Link</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(selectedContentType !== 'all' || selectedTags.length > 0 || searchQuery) && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Add New Item */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                ✨ Capture New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Capture New Item</DialogTitle>
              </DialogHeader>
              <CaptureForm onItemCreated={handleItemCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tag Filters */}
        {tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: Tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-purple-100"
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name} ({tag.usage_count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Semantic Search */}
        <div className="mb-6">
          <SemanticSearch onResults={(results: CapturedItem[]) => setFilteredItems(results)} />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">
              All Items ({filteredItems.length})
            </TabsTrigger>
            <TabsTrigger value="text">
              📝 Text ({getItemsByContentType('text').length})
            </TabsTrigger>
            <TabsTrigger value="code">
              💻 Code ({getItemsByContentType('code').length})
            </TabsTrigger>
            <TabsTrigger value="image">
              🖼️ Images ({getItemsByContentType('image').length})
            </TabsTrigger>
            <TabsTrigger value="link">
              🔗 Links ({getItemsByContentType('link').length})
            </TabsTrigger>
            <TabsTrigger value="visual">
              🎨 Visual Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">No items found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or capture something new!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item: CapturedItem) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onUpdate={handleItemUpdated}
                    onDelete={handleItemDeleted}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="text" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getItemsByContentType('text').map((item: CapturedItem) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdated}
                  onDelete={handleItemDeleted}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getItemsByContentType('code').map((item: CapturedItem) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdated}
                  onDelete={handleItemDeleted}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="image" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {getItemsByContentType('image').map((item: CapturedItem) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdated}
                  onDelete={handleItemDeleted}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getItemsByContentType('link').map((item: CapturedItem) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdated}
                  onDelete={handleItemDeleted}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="visual" className="mt-6">
            <VisualBoard items={getItemsByContentType('image')} />
          </TabsContent>
        </Tabs>

        {/* Stats Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Total: {items.length} items • 
            📝 {getItemsByContentType('text').length} texts • 
            💻 {getItemsByContentType('code').length} code • 
            🖼️ {getItemsByContentType('image').length} images • 
            🔗 {getItemsByContentType('link').length} links
          </p>
          <p className="mt-1">{tags.length} unique tags</p>
        </div>
      </div>
    </div>
  );
}

export default App;
