type ErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_not_found"
  | "weak_password"
  | (string & {})

export const translateAuthErrorCode = (code?: ErrorCode) => {
  if (!code) return null
  switch (code) {
    case "invalid_credentials":
      return "Credenciais inválidas. Confira seu email e senha."
    case "email_not_confirmed":
      return "Confirme seu email antes de tentar novamente."
    case "user_not_found":
      return "Usuário não encontrado."
    case "weak_password":
      return "Senha inválida. Tente novamente."
    default:
      return null
  }
}

export const translateAuthStatus = (status?: number | null) => {
  if (!status) return null
  if (status === 400 || status === 422) {
    return "Requisição inválida. Verifique os dados informados."
  }
  if (status === 401) {
    return "Não autorizado. Confira suas credenciais."
  }
  if (status === 429) {
    return "Muitas tentativas. Tente novamente em instantes."
  }
  return null
}
