import { Buffer } from "buffer"

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
  avatar_public: string | null
  bio: string | null
  display_name: string | null
  perfil: PerfilUsuario | null
}

export enum PerfilUsuario {
  Admin = "Admin",
  Secretaria = "Secretaria",
  Professor = "Professor",
  Aluno = "Aluno",
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: "admin" | "viewer"
  avatarUrl?: string | null
  avatarPublic?: string | null
  bio?: string | null
  displayName?: string | null
  perfil: PerfilUsuario
}

export type SupabaseListedUser = {
  id: string
  name: string
  email: string
  role: PerfilUsuario
  status: "active" | "inactive"
  createdAt: string
  avatarUrl: string | null
  lastSignInAt?: string | null
}

async function getUserDetails(userId: string): Promise<UserDetailsRow | null> {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return null
  }

  const { data, error } = await adminClient
    .from("usuarios_detalhes")
    .select("id, avatar_public, bio, display_name, perfil")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar detalhes do usuário:", error.message)
    return null
  }

  return (data as UserDetailsRow | null) ?? null
}

async function getUserDetailsMap(
  userIds: string[]
): Promise<Record<string, UserDetailsRow>> {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient || userIds.length === 0) {
    return {}
  }

  const { data, error } = await adminClient
    .from("usuarios_detalhes")
    .select("id, avatar_public, bio, display_name, perfil")
    .in("id", userIds)

  if (error || !data) {
    console.error("Erro ao buscar detalhes dos usuários:", error?.message)
    return {}
  }

  return (data as UserDetailsRow[]).reduce<Record<string, UserDetailsRow>>(
    (acc, row) => {
      if (row?.id) {
        acc[row.id] = row
      }
      return acc
    },
    {}
  )
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

  const perfil = normalizePerfil(
    details?.perfil ?? metadata["perfil"]
  )

  const roleMetadata =
    (metadata["role"] as string | undefined) ??
    (user.app_metadata?.role as string | undefined)
  const mappedRole = perfil === PerfilUsuario.Admin ? "admin" : "viewer"

  return {
    id: user.id,
    email,
    name: metadataName ?? displayName ?? email.split("@")[0] ?? "Usuário",
    role: roleMetadata === "admin" ? "admin" : mappedRole,
    avatarUrl: avatarPublic ?? null,
    avatarPublic: avatarPublic ?? null,
    bio: details?.bio ?? null,
    displayName: displayName ?? null,
    perfil,
  }
}

function mapSupabaseUserToListedUser(
  user: SupabaseUser,
  details?: UserDetailsRow | null
): SupabaseListedUser {
  const mapped = mapSupabaseUser(user, details)
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const metaStatus =
    typeof metadata.status === "string"
      ? metadata.status.toLowerCase()
      : undefined
  const status = metaStatus === "inactive" ? "inactive" : "active"
  const lastSignInAt =
    user.last_sign_in_at ??
    mapToString(metadata.last_sign_in_at) ??
    mapToString(metadata.lastSignInAt)

  return {
    id: mapped.id,
    name: mapped.name,
    email: mapped.email,
    role: mapped.perfil,
    status,
    createdAt: user.created_at ?? new Date().toISOString(),
    avatarUrl: mapped.avatarUrl ?? null,
    lastSignInAt,
  }
}

function mapToString(value: unknown): string | null {
  if (!value) return null
  if (typeof value === "string") return value
  if (value instanceof Date) return value.toISOString()
  return null
}

function normalizePerfil(value: unknown): PerfilUsuario {
  switch (value) {
    case PerfilUsuario.Admin:
    case PerfilUsuario.Secretaria:
    case PerfilUsuario.Professor:
    case PerfilUsuario.Aluno:
      return value
    case "admin":
    case "viewer":
      return PerfilUsuario.Secretaria
    default:
      return PerfilUsuario.Secretaria
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
  displayName?: string
  perfil?: PerfilUsuario
}

export async function updateUserProfile(
  userId: string,
  { name, avatarUrl, bio, displayName, perfil }: UpdateProfileInput
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
  if (perfil) {
    metadata.perfil = perfil
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
        avatar_public: avatarUrl ?? null,
        bio: bio ?? null,
        display_name: displayName ?? name ?? null,
        perfil: perfil ?? undefined,
      },
      { onConflict: "id" }
    )

  if (detailsError) {
    throw new Error(detailsError.message)
  }

  const details = await getUserDetails(userId)

  return mapSupabaseUser(data.user, details)
}

export async function uploadAvatarFromDataUrl(
  userId: string,
  dataUrl: string
) {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    throw new Error(
      "Supabase service role key não configurada. Defina SUPABASE_SERVICE_KEY para permitir upload de avatar."
    )
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl)
  if (!match) {
    throw new Error("Formato de imagem inválido. Envie uma imagem base64 válida.")
  }

  const mimeType = match[1]
  const base64Data = match[2]
  const extension = mimeType.split("/")[1]?.split(";")[0] ?? "png"
  const fileName = `usuarios/usuario_${userId}.${extension}`

  const buffer = Buffer.from(base64Data, "base64")

  const { error: uploadError } = await adminClient.storage
    .from("avatares")
    .upload(fileName, buffer, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    throw new Error(
      uploadError.message ?? "Não foi possível enviar a imagem para o Supabase Storage."
    )
  }

  const { data } = adminClient.storage
    .from("avatares")
    .getPublicUrl(fileName)

  const publicUrl = data?.publicUrl
  if (!publicUrl) {
    throw new Error("Não foi possível obter a URL pública do avatar.")
  }

  return {
    publicUrl,
    path: fileName,
  }
}
type CreateUserInput = {
  email: string
  name: string
  perfil: PerfilUsuario
  status: "active" | "inactive"
  password: string
  avatarDataUrl?: string
}

export async function createUserAccount({
  email,
  name,
  perfil,
  status,
  password,
  avatarDataUrl,
}: CreateUserInput) {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    throw new Error(
      "Supabase service role key não configurada. Defina SUPABASE_SERVICE_KEY para permitir criação de usuários."
    )
  }

  const metadata: Record<string, unknown> = {
    name,
    perfil,
    status,
  }

  const appRole = perfil === PerfilUsuario.Admin ? "admin" : "viewer"

  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: { role: appRole },
  })

  if (created.error || !created.data?.user) {
    const err: AuthError | null = created.error ?? null
    throw new Error(
      err?.message ?? "Não foi possível criar o usuário no Supabase."
    )
  }

  const newUser = created.data.user
  let finalUser = newUser
  let uploadedAvatarUrl: string | null = null
  const normalizedAvatarDataUrl = avatarDataUrl?.trim()

  if (normalizedAvatarDataUrl && normalizedAvatarDataUrl.length > 0) {
    const upload = await uploadAvatarFromDataUrl(
      newUser.id,
      normalizedAvatarDataUrl
    )
    uploadedAvatarUrl = upload.publicUrl

    const metadataWithAvatar: Record<string, unknown> = {
      ...((newUser.user_metadata ?? {}) as Record<string, unknown>),
      ...metadata,
      avatar_url: uploadedAvatarUrl,
    }

    const { data: updatedData, error: metadataUpdateError } =
      await adminClient.auth.admin.updateUserById(newUser.id, {
        user_metadata: metadataWithAvatar,
        app_metadata: { role: appRole },
      })

    if (metadataUpdateError || !updatedData?.user) {
      const err: AuthError | null = metadataUpdateError ?? null
      throw new Error(
        err?.message ?? "Não foi possível atualizar o avatar do usuário."
      )
    }

    finalUser = updatedData.user
  }

  const { error: detailsError } = await adminClient
    .from("usuarios_detalhes")
    .upsert(
      {
        id: finalUser.id,
        display_name: name,
        perfil,
        avatar_public: uploadedAvatarUrl ?? null,
      },
      { onConflict: "id" }
    )

  if (detailsError) {
    throw new Error(detailsError.message)
  }

  const details = await getUserDetails(finalUser.id)

  return mapSupabaseUser(finalUser, details)
}

export async function listSupabaseUsers(): Promise<SupabaseListedUser[]> {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    throw new Error(
      "Supabase service role key não configurada. Defina SUPABASE_SERVICE_KEY para permitir listagem de usuários."
    )
  }

  const perPage = 200
  let page = 1
  const collectedUsers: SupabaseUser[] = []

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(error.message ?? "Não foi possível listar os usuários.")
    }

    const batch = data.users ?? []
    collectedUsers.push(
      ...batch.filter((user) => !user.deleted_at && user.aud === "authenticated")
    )

    if (batch.length < perPage) {
      break
    }

    page += 1
  }

  if (collectedUsers.length === 0) {
    return []
  }

  const detailsMap = await getUserDetailsMap(collectedUsers.map((user) => user.id))

  return collectedUsers.map((user) =>
    mapSupabaseUserToListedUser(
      user,
      detailsMap[user.id] ?? null
    )
  )
}

type UpdateUserInput = {
  id: string
  email: string
  name: string
  perfil: PerfilUsuario
  status: "active" | "inactive"
  avatarDataUrl?: string
}

export async function updateUserAccount({
  id,
  email,
  name,
  perfil,
  status,
  avatarDataUrl,
}: UpdateUserInput) {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    throw new Error(
      "Supabase service role key não configurada. Defina SUPABASE_SERVICE_KEY para permitir atualização de usuários."
    )
  }

  const { data: currentData, error: fetchError } = await adminClient.auth.admin.getUserById(id)

  if (fetchError || !currentData?.user) {
    const err: AuthError | null = fetchError ?? null
    throw new Error(
      err?.message ?? "Usuário não encontrado no Supabase."
    )
  }

  const existingUser = currentData.user
  const existingMetadata =
    (existingUser.user_metadata ?? {}) as Record<string, unknown>

  const currentDetails = await getUserDetails(id)
  let avatarPublic = currentDetails?.avatar_public ?? null

  const metadata: Record<string, unknown> = {
    ...existingMetadata,
    name,
    perfil,
    status,
  }

  const normalizedAvatarDataUrl = avatarDataUrl?.trim()
  if (normalizedAvatarDataUrl && normalizedAvatarDataUrl.length > 0) {
    const upload = await uploadAvatarFromDataUrl(id, normalizedAvatarDataUrl)
    metadata.avatar_url = upload.publicUrl
    avatarPublic = upload.publicUrl
  }

  const appRole = perfil === PerfilUsuario.Admin ? "admin" : "viewer"

  const { data: updatedData, error: updateError } =
    await adminClient.auth.admin.updateUserById(id, {
      email,
      user_metadata: metadata,
      app_metadata: { role: appRole },
    })

  if (updateError || !updatedData?.user) {
    const err: AuthError | null = updateError ?? null
    throw new Error(
      err?.message ?? "Não foi possível atualizar os dados do usuário."
    )
  }

  const { error: detailsError } = await adminClient
    .from("usuarios_detalhes")
    .upsert(
      {
        id,
        display_name: name,
        perfil,
        avatar_public: avatarPublic,
      },
      { onConflict: "id" }
    )

  if (detailsError) {
    throw new Error(detailsError.message)
  }

  const details = await getUserDetails(id)

  return mapSupabaseUserToListedUser(updatedData.user, details)
}
