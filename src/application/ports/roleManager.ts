export interface RoleManagerPort<Member> {
  assignRole(
    member: Member,
    roleId: string,
    contextLabel: string,
  ): Promise<void>;
  removeRole(
    member: Member,
    roleId: string,
    contextLabel: string,
  ): Promise<void>;
}
