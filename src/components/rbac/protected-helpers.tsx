import React from "react"
import { ProtectedComponent } from "./ProtectedComponent"
import { Permission } from "@/types/rbac.types"
import { useRBAC } from "@/hooks/utils/useRBAC"

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll: boolean = false
) {
  return function ProtectedPageWrapper(props: P) {
    const permissions = Array.isArray(permission) ? permission : [permission]

    return (
      <ProtectedComponent permissions={permissions} requireAll={requireAll}>
        <Component {...props} />
      </ProtectedComponent>
    )
  }
}

export const useConditionalRender = () => {
  const rbac = useRBAC()

  return {
    renderIf: (condition: boolean, component: React.ReactNode) =>
      condition ? component : null,
    renderWithPermission: (permission: Permission, component: React.ReactNode) =>
      rbac.hasPermission(permission) ? component : null,
    renderWithAnyPermission: (permissions: Permission[], component: React.ReactNode) =>
      rbac.hasAnyPermission(permissions) ? component : null,
    renderWithAllPermissions: (permissions: Permission[], component: React.ReactNode) =>
      rbac.hasAllPermissions(permissions) ? component : null,
    renderWithAccess: (resource: string, action: string, component: React.ReactNode) =>
      rbac.canAccess(resource, action) ? component : null,
  }
}
