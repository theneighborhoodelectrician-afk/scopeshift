export function canViewTeam(role: string) {
  return ["owner", "manager", "admin"].includes(role);
}
