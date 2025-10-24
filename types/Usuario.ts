export interface User {
  id: number
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  createdAt: string
  avatar?: string
}

export type UserRole = "Admin" | "Editor" | "Viewer"

export type UserStatus = "active" | "inactive"

export type CreateUserInput = Omit<User, "id" | "createdAt">

export type UpdateUserInput = Partial<User>
