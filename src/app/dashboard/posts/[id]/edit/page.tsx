import type { Metadata } from "next"

import { PostFormPageClient } from "../../post-form-page-client"

export const metadata: Metadata = {
  title: "Editar post - FAFIH Dashboard",
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <PostFormPageClient mode="edit" postId={resolvedParams.id} />
}
