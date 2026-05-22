import React from "react"
import { ProtectedRoute } from "./ProtectedRoute"
import { Permission } from "@/types/rbac.types"
import { Role } from "@/types/auth.types"

export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Role[]
) {
  return function ProtectedPageWrapper(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

export function withPermissionProtection<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll: boolean = false
) {
  return function ProtectedPageWrapper(props: P) {
    const permissions = Array.isArray(permission) ? permission : [permission]

    return (
      <ProtectedRoute permissions={permissions} requireAll={requireAll}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
