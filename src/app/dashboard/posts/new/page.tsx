import type { Metadata } from "next"

import { PostFormPageClient } from "../post-form-page-client"

export const metadata: Metadata = {
  title: "Novo post - FAFIH Dashboard",
}

export default function NewPostPage() {
  return <PostFormPageClient mode="create" />
}
