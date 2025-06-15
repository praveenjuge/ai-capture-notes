
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CapturedItem, ContentType } from '../../../server/src/schema';

interface SemanticSearchProps {
  onResults: (items: CapturedItem[]) => void;
}

export function SemanticSearch({ onResults }: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<ContentType | 'all'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [lastResults, setLastResults] = useState<CapturedItem[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await trpc.semanticSearch.query({
        query: query.trim(),
        content_type: contentType === 'all' ? undefined : contentType,
        limit: 20
      });
      
      setLastResults(results);
      onResults(results);
    } catch (error) {
      console.error('Semantic search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setContentType('all');
    setLastResults([]);
    // Reset to show all items - you might want to call a callback here
    // For now, we'll just clear the results
    onResults([]);
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧠 AI Semantic Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            placeholder="🔍 Ask AI to find content... (e.g., 'JavaScript functions', 'design inspiration')"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="flex-1"
          />
          
          <Select value={contentType} onValueChange={(value: string) => setContentType(value as ContentType | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="text">📝 Text</SelectItem>
              <SelectItem value="code">💻 Code</SelectItem>
              <SelectItem value="image">🖼️ Image</SelectItem>
              <SelectItem value="link">🔗 Link</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            type="submit" 
            disabled={!query.trim() || isSearching}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isSearching ? '🤖' : '🚀'} {isSearching ? 'Searching...' : 'Search'}
          </Button>
          
          {lastResults.length > 0 && (
            <Button type="button" variant="outline" onClick={clearSearch}>
              Clear
            </Button>
          )}
        </form>
        
        {lastResults.length > 0 && (
          <div className="text-sm text-gray-600">
            🎯 Found {lastResults.length} semantically similar items
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          💡 Try queries like: "React components", "API documentation", "design patterns", "meeting notes"
        </div>
      </CardContent>
    </Card>
  );
}
