# Contextos

AuthContext.tsx fornece token, usuário, login e logout por useAuth.
Os dados são persistidos no localStorage; logout remove a sessão local,
sem revogar o token no servidor. ProtectedRoute usa o contexto para controlar
o acesso ao dashboard. A autorização real dos recursos é aplicada no backend.