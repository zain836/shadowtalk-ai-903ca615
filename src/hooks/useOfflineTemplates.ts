import { useState, useCallback, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables: string[];
  icon: string;
  isBuiltIn: boolean;
  createdAt: Date;
  usageCount: number;
}

interface OfflineTemplatesState {
  templates: PromptTemplate[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
}

const DB_NAME = 'shadowtalk-templates';
const STORE_NAME = 'templates';

// Built-in templates
const BUILT_IN_TEMPLATES: Omit<PromptTemplate, 'createdAt' | 'usageCount'>[] = [
  {
    id: 'explain-concept',
    name: 'Explain Like I\'m 5',
    description: 'Get simple explanations for complex topics',
    category: 'Learning',
    prompt: 'Explain {topic} in simple terms that a 5-year-old could understand. Use analogies and examples.',
    variables: ['topic'],
    icon: '🧒',
    isBuiltIn: true,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Get detailed code review with suggestions',
    category: 'Programming',
    prompt: 'Review this code and provide:\n1. Potential bugs or issues\n2. Performance improvements\n3. Code style suggestions\n4. Security concerns\n\nCode:\n{code}',
    variables: ['code'],
    icon: '🔍',
    isBuiltIn: true,
  },
  {
    id: 'debug-error',
    name: 'Debug Error',
    description: 'Help debug error messages',
    category: 'Programming',
    prompt: 'I\'m getting this error:\n{error}\n\nIn this context:\n{context}\n\nPlease help me understand:\n1. What\'s causing this error\n2. How to fix it\n3. How to prevent it in the future',
    variables: ['error', 'context'],
    icon: '🐛',
    isBuiltIn: true,
  },
  {
    id: 'summarize',
    name: 'Summarize Text',
    description: 'Get a concise summary of long text',
    category: 'Writing',
    prompt: 'Summarize the following text in {length} bullet points, capturing the key insights:\n\n{text}',
    variables: ['text', 'length'],
    icon: '📝',
    isBuiltIn: true,
  },
  {
    id: 'email-draft',
    name: 'Draft Email',
    description: 'Write professional emails quickly',
    category: 'Writing',
    prompt: 'Write a {tone} email about {subject}.\nRecipient: {recipient}\nKey points to include:\n{points}',
    variables: ['tone', 'subject', 'recipient', 'points'],
    icon: '✉️',
    isBuiltIn: true,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm Ideas',
    description: 'Generate creative ideas for any topic',
    category: 'Creative',
    prompt: 'Generate {count} creative ideas for {topic}. For each idea, provide:\n- Brief description\n- Potential benefits\n- Implementation difficulty (easy/medium/hard)',
    variables: ['count', 'topic'],
    icon: '💡',
    isBuiltIn: true,
  },
  {
    id: 'pros-cons',
    name: 'Pros and Cons',
    description: 'Analyze decisions with balanced perspective',
    category: 'Analysis',
    prompt: 'Analyze the pros and cons of {decision}.\n\nProvide:\n- 5 key advantages\n- 5 key disadvantages\n- Overall recommendation\n- Key considerations',
    variables: ['decision'],
    icon: '⚖️',
    isBuiltIn: true,
  },
  {
    id: 'learn-skill',
    name: 'Learn New Skill',
    description: 'Get a learning roadmap for any skill',
    category: 'Learning',
    prompt: 'Create a learning roadmap for {skill}.\n\nMy current level: {level}\nTime available: {time} per week\n\nInclude:\n1. Prerequisites\n2. Week-by-week plan\n3. Recommended resources\n4. Practice projects\n5. Milestones to track progress',
    variables: ['skill', 'level', 'time'],
    icon: '🎯',
    isBuiltIn: true,
  },
  {
    id: 'refactor-code',
    name: 'Refactor Code',
    description: 'Improve code quality and structure',
    category: 'Programming',
    prompt: 'Refactor this code to improve:\n- Readability\n- Maintainability\n- Performance\n- {focus}\n\nCode:\n{code}\n\nExplain your changes.',
    variables: ['code', 'focus'],
    icon: '🔧',
    isBuiltIn: true,
  },
  {
    id: 'translate-code',
    name: 'Translate Code',
    description: 'Convert code between languages',
    category: 'Programming',
    prompt: 'Translate this {from_lang} code to {to_lang}, maintaining the same functionality and following {to_lang} best practices:\n\n{code}',
    variables: ['from_lang', 'to_lang', 'code'],
    icon: '🔄',
    isBuiltIn: true,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structure meeting notes professionally',
    category: 'Productivity',
    prompt: 'Format these meeting notes into a professional summary:\n\n{notes}\n\nInclude:\n- Attendees (if mentioned)\n- Key discussion points\n- Decisions made\n- Action items with owners\n- Next steps',
    variables: ['notes'],
    icon: '📋',
    isBuiltIn: true,
  },
  {
    id: 'social-post',
    name: 'Social Media Post',
    description: 'Create engaging social media content',
    category: 'Marketing',
    prompt: 'Write a {platform} post about {topic}.\n\nTone: {tone}\nGoal: {goal}\n\nInclude relevant hashtags and a call to action.',
    variables: ['platform', 'topic', 'tone', 'goal'],
    icon: '📱',
    isBuiltIn: true,
  },
];

export const useOfflineTemplates = () => {
  const [state, setState] = useState<OfflineTemplatesState>({
    templates: [],
    categories: [],
    isLoading: true,
    error: null,
  });

  const getDB = async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category');
          store.createIndex('isBuiltIn', 'isBuiltIn');
        }
      },
    });
  };

  // Initialize templates
  useEffect(() => {
    const initTemplates = async () => {
      try {
        const db = await getDB();
        const existingTemplates = await db.getAll(STORE_NAME);

        // Add built-in templates if not present
        for (const template of BUILT_IN_TEMPLATES) {
          const exists = existingTemplates.some(t => t.id === template.id);
          if (!exists) {
            await db.put(STORE_NAME, {
              ...template,
              createdAt: new Date(),
              usageCount: 0,
            });
          }
        }

        const allTemplates = await db.getAll(STORE_NAME);
        const categories = [...new Set(allTemplates.map(t => t.category))].sort();

        setState({
          templates: allTemplates,
          categories,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load templates',
        }));
      }
    };

    initTemplates();
  }, []);

  const addTemplate = useCallback(async (
    template: Omit<PromptTemplate, 'id' | 'createdAt' | 'usageCount' | 'isBuiltIn'>
  ): Promise<PromptTemplate> => {
    const db = await getDB();
    const newTemplate: PromptTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      createdAt: new Date(),
      usageCount: 0,
      isBuiltIn: false,
    };

    await db.put(STORE_NAME, newTemplate);

    setState(prev => ({
      ...prev,
      templates: [...prev.templates, newTemplate],
      categories: [...new Set([...prev.categories, template.category])].sort(),
    }));

    return newTemplate;
  }, []);

  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<Omit<PromptTemplate, 'id' | 'isBuiltIn'>>
  ): Promise<void> => {
    const db = await getDB();
    const existing = await db.get(STORE_NAME, id);
    
    if (!existing) throw new Error('Template not found');
    if (existing.isBuiltIn) throw new Error('Cannot modify built-in templates');

    const updated = { ...existing, ...updates };
    await db.put(STORE_NAME, updated);

    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === id ? updated : t),
    }));
  }, []);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    const db = await getDB();
    const existing = await db.get(STORE_NAME, id);
    
    if (!existing) throw new Error('Template not found');
    if (existing.isBuiltIn) throw new Error('Cannot delete built-in templates');

    await db.delete(STORE_NAME, id);

    setState(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== id),
    }));
  }, []);

  const useTemplate = useCallback(async (
    id: string,
    variables: Record<string, string>
  ): Promise<string> => {
    const db = await getDB();
    const template = await db.get(STORE_NAME, id);
    
    if (!template) throw new Error('Template not found');

    // Increment usage count
    template.usageCount = (template.usageCount || 0) + 1;
    await db.put(STORE_NAME, template);

    // Replace variables in prompt
    let prompt = template.prompt;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t => 
        t.id === id ? { ...t, usageCount: template.usageCount } : t
      ),
    }));

    return prompt;
  }, []);

  const getTemplatesByCategory = useCallback((category: string): PromptTemplate[] => {
    return state.templates.filter(t => t.category === category);
  }, [state.templates]);

  const searchTemplates = useCallback((query: string): PromptTemplate[] => {
    const lowerQuery = query.toLowerCase();
    return state.templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }, [state.templates]);

  const getMostUsed = useCallback((limit: number = 5): PromptTemplate[] => {
    return [...state.templates]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }, [state.templates]);

  return {
    ...state,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getTemplatesByCategory,
    searchTemplates,
    getMostUsed,
  };
};
