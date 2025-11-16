import type { Metadata } from "next"

import { PostsPageClient } from "./posts-page-client"

export const metadata: Metadata = {
  title: "Posts - FAFIH Dashboard",
  description: "Gerencie os posts do blog da FAFIH.",
}

export default function PostsPage() {
  return <PostsPageClient />
}
