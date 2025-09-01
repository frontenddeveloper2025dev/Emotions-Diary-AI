import { DevvAI } from '@devvai/devv-code-backend';

export interface EmotionAnalysis {
  mood: string;
  sentiment: number; // -1 to 1 scale
  emotions: string[];
  tags: string[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class AIService {
  private ai: DevvAI;

  constructor() {
    this.ai = new DevvAI();
  }

  /**
   * Analyze the emotion and mood of a diary entry
   */
  async analyzeEmotion(content: string): Promise<EmotionAnalysis> {
    try {
      const prompt = `
Analyze the emotional content of this diary entry and provide a structured response.

Diary Entry:
"${content}"

Please respond with a JSON object containing:
- mood: primary mood (happy, sad, anxious, excited, peaceful, frustrated, etc.)
- sentiment: numerical score from -1 (very negative) to 1 (very positive)
- emotions: array of specific emotions detected (max 3)
- tags: array of relevant tags/themes (max 5)
- summary: brief emotional summary in one sentence

Focus on emotional intelligence and empathy. Be understanding and supportive.
`;

      const response = await this.ai.chat.completions.create({
        model: 'default',
        messages: [
          {
            role: 'system',
            content: 'You are an empathetic AI therapist specializing in emotional analysis. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      });

      const result = response.choices[0].message.content;
      if (!result) throw new Error('No response from AI');

      // Parse JSON response
      const analysis = JSON.parse(result) as EmotionAnalysis;
      
      // Validate and sanitize
      return {
        mood: analysis.mood || 'neutral',
        sentiment: Math.max(-1, Math.min(1, analysis.sentiment || 0)),
        emotions: (analysis.emotions || []).slice(0, 3),
        tags: (analysis.tags || []).slice(0, 5),
        summary: analysis.summary || 'Entry analyzed successfully'
      };

    } catch (error) {
      console.error('Emotion analysis failed:', error);
      
      // Fallback analysis
      return {
        mood: 'neutral',
        sentiment: 0,
        emotions: ['reflective'],
        tags: ['personal'],
        summary: 'Unable to analyze emotions at this time'
      };
    }
  }

  /**
   * Chat with AI based on diary history and current conversation
   */
  async chatWithAI(
    messages: ChatMessage[],
    diaryContext?: string
  ): Promise<string> {
    try {
      const systemPrompt = `
You are Luna, a compassionate AI companion who helps users understand their emotions through their diary entries. 

${diaryContext ? `
Recent diary context:
${diaryContext}

Use this context to provide personalized, empathetic responses.
` : ''}

Guidelines:
- Be warm, understanding, and supportive
- Offer gentle insights about emotional patterns
- Ask thoughtful follow-up questions
- Respect privacy and be non-judgmental
- Keep responses conversational and helpful
- If asked about specific entries, reference them appropriately
`;

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const response = await this.ai.chat.completions.create({
        model: 'kimi-k2-0711-preview', // Using Kimi for better emotional intelligence
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || 'I understand, but I\'m having trouble responding right now. Please try again.';

    } catch (error) {
      console.error('AI chat failed:', error);
      return 'I apologize, but I\'m having difficulty connecting right now. Please try again in a moment.';
    }
  }

  /**
   * Generate auto tags for a diary entry
   */
  async generateTags(content: string): Promise<string[]> {
    try {
      const response = await this.ai.chat.completions.create({
        model: 'default',
        messages: [
          {
            role: 'system',
            content: 'Generate 3-5 relevant tags for this diary entry. Return only the tags as a comma-separated list.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.5,
        max_tokens: 100
      });

      const result = response.choices[0].message.content;
      if (!result) return [];

      return result
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 5);

    } catch (error) {
      console.error('Tag generation failed:', error);
      return [];
    }
  }

  /**
   * Stream AI chat response for real-time conversation
   */
  async *streamChatResponse(
    messages: ChatMessage[],
    diaryContext?: string
  ): AsyncGenerator<string> {
    try {
      const systemPrompt = `You are Luna, a compassionate AI companion specializing in emotional support and diary analysis.

${diaryContext ? `Recent diary context: ${diaryContext}` : ''}

Be warm, empathetic, and provide gentle insights about emotional patterns.`;

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const stream = await this.ai.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }

    } catch (error) {
      console.error('Streaming chat failed:', error);
      yield 'I apologize, but I\'m having difficulty connecting right now.';
    }
  }
}

export const aiService = new AIService();