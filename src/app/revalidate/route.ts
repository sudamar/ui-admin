import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import { CACHE_PATHS, CACHE_TAGS } from "@/lib/cache/revalidate-targets"

export async function GET() {
  try {
    const revalidated = {
      tags: [] as string[],
      paths: [] as string[],
    }

    for (const tag of CACHE_TAGS) {
      revalidateTag(tag, { expire: 0 })
      revalidated.tags.push(tag)
    }

    for (const path of CACHE_PATHS) {
      revalidatePath(path)
      revalidated.paths.push(path)
    }

    return NextResponse.json({
      success: true,
      message: "Cache revalidated successfully.",
      revalidated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Revalidate][GET] Failed to revalidate cache.", error)
    const message = error instanceof Error ? error.message : "Unexpected error while revalidating cache."
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    )
  }
}
