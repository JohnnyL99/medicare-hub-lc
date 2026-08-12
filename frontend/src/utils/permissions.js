export function hasRole(user, roles) {
  return Boolean(user?.role && roles.includes(user.role));
}
