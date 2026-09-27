'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import StoryStudio from '@/components/studio/StoryStudio';
import { publishingService } from '@/services/content/publishingService';
import { PublishingArticle } from '@/types/publishing';

/**
 * /portal/submit — unified story creation & editing workspace.
 * Reads ?edit=<articleId> to pre-load an existing draft for editing.
 */
export default function SubmitArticlePage() {
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
