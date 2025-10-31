
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag")
  const path = request.nextUrl.searchParams.get("path")

  if (tag) {
    revalidateTag(tag, { expire: 0 })
  }

  if (path) {
    revalidatePath(path)
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
