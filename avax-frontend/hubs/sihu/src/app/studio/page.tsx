'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import StoryStudio from '@/components/studio/StoryStudio';
import { publishingService } from '@/services/content/publishingService';
import { PublishingArticle } from '@/types/publishing';

/**
 * /studio — canonical story creation & editing workspace.
 * Accepts ?edit=<articleId> to pre-load an existing article.
 */
export default function StudioPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [article, setArticle] = useState<PublishingArticle | undefined>(undefined);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    publishingService.getArticleById(editId).then(found => {
      setArticle(found);
      setLoading(false);
    });
  }, [editId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#05100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6ee7b7', fontSize: '0.85rem' }}>
        Loading draft…
      </div>
    );
  }

  return <StoryStudio initialArticle={article} />;
}
