import {
  createClient,
  type SupabaseClient,
  type User as SupabaseUser,
  type AuthError,
} from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are not set")
}

const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
let supabaseAdminClient: SupabaseClient | null = null

function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseServiceKey) {
    return null
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      supabaseUrl as string,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  }

  return supabaseAdminClient
}

type UserDetailsRow = {
  id: string
  avatar: string | null
  avatar_public: string | null
  bio: string | null
  display_name: string | null
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: "admin" | "viewer"
  avatarUrl?: string | null
  avatar?: string | null
  avatarPublic?: string | null
  bio?: string | null
  displayName?: string | null
}

async function getUserDetails(userId: string): Promise<UserDetailsRow | null> {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return null
  }

  const { data, error } = await adminClient
    .from("usuarios_detalhes")
    .select("id, avatar, avatar_public, bio, display_name")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar detalhes do usuário:", error.message)
    return null
  }

  return (data as UserDetailsRow | null) ?? null
}

function mapSupabaseUser(
  user: SupabaseUser,
  details?: UserDetailsRow | null
): AuthUser {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const email = user.email ?? ""

  const metadataName =
    (metadata["name"] as string | undefined) ??
    (metadata["full_name"] as string | undefined) ??
    (metadata["display_name"] as string | undefined)

  const displayName =
    details?.display_name ??
    (metadata["display_name"] as string | undefined) ??
    metadataName ??
    undefined

  const avatarPublic =
    details?.avatar_public ??
    (metadata["avatar_url"] as string | undefined) ??
    (metadata["avatar"] as string | undefined) ??
    undefined

  const roleMetadata =
    (metadata["role"] as string | undefined) ??
    (user.app_metadata?.role as string | undefined)

  return {
    id: user.id,
    email,
    name: metadataName ?? displayName ?? email.split("@")[0] ?? "Usuário",
    role: roleMetadata === "admin" ? "admin" : "viewer",
    avatarUrl: avatarPublic ?? null,
    avatar: details?.avatar ?? null,
    avatarPublic: avatarPublic ?? null,
    bio: details?.bio ?? null,
    displayName: displayName ?? null,
  }
}

export async function getProfileFromToken(token: string | undefined | null) {
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    if (error) {
      console.error("Erro ao obter usuário no Supabase:", error.message)
    }
    return null
  }

  const details = await getUserDetails(data.user.id)
  return mapSupabaseUser(data.user, details)
}

export async function signInWithEmailAndPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session || !data.user) {
    return {
      error,
    }
  }

  const details = await getUserDetails(data.user.id)

  return {
    session: data.session,
    user: mapSupabaseUser(data.user, details),
  }
}

type UpdateProfileInput = {
  name?: string
  avatarUrl?: string
  bio?: string
  avatar?: string
  displayName?: string
}

export async function updateUserProfile(
  userId: string,
  { name, avatarUrl, bio, avatar, displayName }: UpdateProfileInput
) {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    throw new Error(
      "Supabase service role key não configurada. Defina SUPABASE_SERVICE_KEY para permitir atualização de perfil."
    )
  }

  const metadata: Record<string, string | undefined> = {}
  if (typeof name === "string") {
    metadata.name = name || undefined
  }
  if (typeof displayName === "string") {
    metadata.display_name = displayName || undefined
  }
  if (typeof avatarUrl === "string") {
    metadata.avatar_url = avatarUrl || undefined
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  })

  if (error || !data.user) {
    const err: AuthError | null = error ?? null
    throw new Error(
      err?.message ?? "Não foi possível atualizar o perfil do usuário."
    )
  }

  const { error: detailsError } = await adminClient
    .from("usuarios_detalhes")
    .upsert(
      {
        id: userId,
        avatar: avatar ?? null,
        avatar_public: avatarUrl ?? null,
        bio: bio ?? null,
        display_name: displayName ?? name ?? null,
      },
      { onConflict: "id" }
    )

  if (detailsError) {
    throw new Error(detailsError.message)
  }

  const details = await getUserDetails(userId)

  return mapSupabaseUser(data.user, details)
}
