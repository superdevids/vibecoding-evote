import type { PermissionCheck, Role } from '@/lib/types'
import { db } from '@/lib/db'

export async function checkPermission(
  roleId: string,
  action: string,
  resource: string
): Promise<PermissionCheck> {
  if (!roleId) {
    return { granted: false, role: null, action, resource }
  }

  const role = await db.collection('roles').findById<Role>(roleId)
  if (!role) {
    return { granted: false, role: null, action, resource }
  }

  const permissions = role.permissions[resource]
  if (!permissions) {
    return { granted: false, role: role.name, action, resource }
  }

  const hasWildcard = permissions.includes('*')
  const hasAction = permissions.includes(action)

  return {
    granted: hasWildcard || hasAction,
    role: role.name,
    action,
    resource,
  }
}
