import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useBlogPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (data && !error) setPosts(data);
      setIsLoading(false);
    };
    load();
  }, []);

  return { posts, isLoading };
}

export function useChangelogEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (data && !error) setEntries(data);
      setIsLoading(false);
    };
    load();
  }, []);

  return { entries, isLoading };
}

export function useFAQItems() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      
      if (data && !error) setItems(data);
      setIsLoading(false);
    };
    load();
  }, []);

  return { items, isLoading };
}

export function useStatusMonitors() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('status_monitors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (data && !error) setMonitors(data);
      setIsLoading(false);
    };
    load();
  }, []);

  return { monitors, isLoading };
}

export function useDocsPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('docs_pages')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      
      if (data && !error) setPages(data);
      setIsLoading(false);
    };
    load();
  }, []);

  return { pages, isLoading };
}
