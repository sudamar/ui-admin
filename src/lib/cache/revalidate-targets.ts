export const CACHE_TAGS = [
  "categories:list",
  "categories:detail",
  "trabalhos:list",
  "trabalhos:detail",
  "usuarios:list",
  "usuarios:detail",
  "cursos:list",
  "cursos:detail",
  "polos:list",
  "professores:list",
  "settings",
  "dashboard:metrics",
  "dashboardCards",
] as const

export const CACHE_PATHS = [
  "/",
  "/dashboard",
  "/dashboard/usuarios",
  "/dashboard/perfil",
  "/dashboard/polos",
  "/dashboard/professores",
  "/dashboard/cursos",
  "/dashboard/biblioteca",
  "/dashboard/biblioteca/categorias",
  "/dashboard/settings",
] as const
