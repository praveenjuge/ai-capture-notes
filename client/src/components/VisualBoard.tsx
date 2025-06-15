
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CapturedItem } from '../../../server/src/schema';

interface VisualBoardProps {
  items: CapturedItem[];
}

export function VisualBoard({ items }: VisualBoardProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🖼️</div>
        <p className="text-gray-500 text-lg">No images captured yet</p>
        <p className="text-gray-400 text-sm">Capture some images to see them in the visual board!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎨 Visual Board</h2>
        <p className="text-gray-600">All your captured images in one beautiful view</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item: CapturedItem) => (
          <Dialog key={item.id}>
            <DialogTrigger asChild>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={item.content} 
                      alt={item.title || 'Captured image'} 
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-t-lg" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs">
                        🔍 View
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    {item.title && (
                      <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {item.created_at.toLocaleDateString()}
                    </p>
                    
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  🖼️ {item.title || 'Captured Image'}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  <img 
                    src={item.content} 
                    alt={item.title || 'Captured image'} 
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                  
                  <div className="space-y-3">
                    {item.description && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Description:</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-sm mb-1">URL:</h4>
                      <p className="text-xs text-blue-600 break-all">{item.content}</p>
                    </div>
                    
                    {item.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Tags:</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Created: {item.created_at.toLocaleString()}<br />
                      {item.updated_at.getTime() !== item.created_at.getTime() && (
                        <>Updated: {item.updated_at.toLocaleString()}</>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
