
import { type GenerateTagsInput } from '../schema';

export const generateTags = async (input: GenerateTagsInput): Promise<string[]> => {
  try {
    // Prepare content for AI analysis
    const contentParts = [];
    
    if (input.title) {
      contentParts.push(`Title: ${input.title}`);
    }
    
    if (input.description) {
      contentParts.push(`Description: ${input.description}`);
    }
    
    contentParts.push(`Content: ${input.content}`);
    contentParts.push(`Content Type: ${input.content_type}`);
    
    const fullContent = contentParts.join('\n\n');
    
    // Simple AI prompt for tag generation
    const prompt = `Analyze the following content and generate 3-5 relevant tags. Tags should be:
- Single words or short phrases (2-3 words max)
- Descriptive of the content's topic, technology, or purpose
- Lowercase
- Useful for categorization and search

Content to analyze:
${fullContent}

Return only the tags, one per line, without numbers or bullets:`;

    // Mock AI response for now - in a real implementation, this would call an AI service
    // like OpenAI, Anthropic Claude, or a local LLM
    const aiResponse = await mockAICall(prompt, input);
    
    // Parse AI response into clean tags
    const tags = aiResponse
      .split('\n')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50) // Reasonable tag length limit
      .slice(0, 5); // Limit to 5 tags max
    
    return tags;
    
  } catch (error) {
    console.error('Tag generation failed:', error);
    throw error;
  }
};

// Mock AI implementation - replace with actual AI service
async function mockAICall(prompt: string, input: GenerateTagsInput): Promise<string> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate contextual tags based on content type and content
  const tags: string[] = [];
  
  // Combine all text for analysis
  const textToAnalyze = [input.title, input.description, input.content]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  // Add content-type specific tags
  switch (input.content_type) {
    case 'code':
      tags.push('programming');
      // Try to detect language from content
      if (input.content.includes('function') || input.content.includes('const') || input.content.includes('require')) {
        tags.push('javascript');
      } else if (input.content.includes('def ') || input.content.includes('import ')) {
        tags.push('python');  
      } else if (input.content.includes('SELECT') || input.content.includes('FROM') || input.content.includes('WHERE')) {
        tags.push('sql');
      }
      break;
    case 'link':
      tags.push('reference');
      if (input.content.includes('github.com')) {
        tags.push('github');
      } else if (input.content.includes('stackoverflow.com')) {
        tags.push('stackoverflow');
      }
      break;
    case 'image':
      tags.push('visual');
      tags.push('media');
      break;
    case 'text':
      tags.push('notes');
      break;
  }
  
  // Add topic-based tags from all text content
  if (textToAnalyze.includes('api') || textToAnalyze.includes('endpoint')) {
    tags.push('api');
  }
  if (textToAnalyze.includes('database') || textToAnalyze.includes('db') || 
      textToAnalyze.includes('sql') || textToAnalyze.includes('select') || 
      textToAnalyze.includes('users') || textToAnalyze.includes('query')) {
    tags.push('database');
  }
  if (textToAnalyze.includes('auth') || textToAnalyze.includes('login')) {
    tags.push('authentication');
  }
  if (textToAnalyze.includes('test') || textToAnalyze.includes('testing')) {
    tags.push('testing');
  }
  if (textToAnalyze.includes('docker') || textToAnalyze.includes('container')) {
    tags.push('docker');
  }
  if (textToAnalyze.includes('react') || textToAnalyze.includes('component')) {
    tags.push('react');
  }
  
  // Ensure we have at least some tags
  if (tags.length === 0) {
    tags.push('misc');
  }
  
  // Remove duplicates and limit to 5
  const uniqueTags = [...new Set(tags)].slice(0, 5);
  
  return uniqueTags.join('\n');
}
