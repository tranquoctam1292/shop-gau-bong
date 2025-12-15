import { redirect } from 'next/navigation';

/**
 * Blog page - redirects to posts
 * Blog route is actually /posts
 */
export default function BlogPage() {
  redirect('/posts');
}

