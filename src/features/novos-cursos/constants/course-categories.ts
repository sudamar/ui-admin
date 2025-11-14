export const COURSE_CATEGORY_OPTIONS = [
  { value: "extensao", label: "Extensão" },
  { value: "especializacao", label: "Pós Graduação" },
  { value: "congresso", label: "Congressos" },
  { value: "graduacao", label: "Graduação" },
  { value: "formacao", label: "Formação" },
  { value: "palestras", label: "Palestras" },
] as const

export const COURSE_CATEGORY_LABEL_MAP = COURSE_CATEGORY_OPTIONS.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.value] = option.label
    return acc
  },
  {},
)
