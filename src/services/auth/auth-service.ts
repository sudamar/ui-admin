type MockUser = {
  id: number
  name: string
  email: string
  avatarUrl?: string
  role: "admin" | "viewer"
}

const mockUsers: Record<string, MockUser> = {
  "admin@example.com": {
    id: 1,
    name: "John Doe",
    email: "admin@example.com",
    avatarUrl: "/assets/avatares/1.png",
    role: "admin",
  },
  "maria@fafih.edu.br": {
    id: 2,  
    name: "Maria Santos",
    email: "maria@fafih.edu.br",
    avatarUrl: "/assets/avatares/2.png",
    role: "admin",
  },
}

function decodeToken(token: string) {
  try {
    const raw = Buffer.from(token, "base64").toString("utf8")
    const [email] = raw.split(":")
    return email
  } catch {
    return null
  }
}

export function getProfileFromToken(token: string | undefined | null) {
  if (!token) return null

  const email = decodeToken(token)
  if (!email) return null

  const user = mockUsers[email] ?? {
    name: email.split("@")[0],
    email,
    role: "viewer" as const,
  }

  return user
}
