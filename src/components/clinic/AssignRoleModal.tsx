"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/auth.types";
import { Badge } from "@/components/ui/badge";
import { ROLE_PERMISSIONS, Permission } from "@/types/rbac.types";
import { 
  Loader2, 
  ShieldCheck, 
  Check, 
  Shield, 
  Search, 
  RotateCcw, 
  UserCircle2,
  Lock,
  ChevronRight,
  Settings2,
  Zap
} from "lucide-react";
import { updateUserRole, updateUser } from "@/lib/actions/users.server";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Roles clinic admin can assign
const CLINIC_ADMIN_ASSIGNABLE_ROLES: Role[] = [
  Role.DOCTOR,
  Role.ASSISTANT_DOCTOR,
  Role.RECEPTIONIST,
  Role.PHARMACIST,
  Role.NURSE,
  Role.THERAPIST,
  Role.LAB_TECHNICIAN,
  Role.COUNSELOR,
  Role.SUPPORT_STAFF,
  Role.FINANCE_BILLING,
  Role.HR_MANAGER,
];

// All staff roles for super admin
const ALL_STAFF_ROLES: Role[] = [
  Role.DOCTOR,
  Role.ASSISTANT_DOCTOR,
  Role.RECEPTIONIST,
  Role.PHARMACIST,
  Role.NURSE,
  Role.THERAPIST,
  Role.LAB_TECHNICIAN,
  Role.COUNSELOR,
  Role.SUPPORT_STAFF,
  Role.FINANCE_BILLING,
  Role.HR_MANAGER,
  Role.CLINIC_ADMIN,
  Role.CLINIC_LOCATION_HEAD,
];

const ROLE_INFO: Record<string, { label: string; description: string }> = {
  [Role.SUPER_ADMIN]: { label: "Super Admin", description: "Full system access including all clinics and global settings." },
  [Role.CLINIC_ADMIN]: { label: "Clinic Admin", description: "Full control over a specific clinic, staff, and settings." },
  [Role.CLINIC_LOCATION_HEAD]: { label: "Location Head", description: "Manages a specific location branch of the clinic." },
  [Role.DOCTOR]: { label: "Doctor", description: "Can manage appointments, view/edit patient clinical records." },
  [Role.ASSISTANT_DOCTOR]: { label: "Assistant Doctor", description: "Can assist with records and appointments under supervision." },
  [Role.RECEPTIONIST]: { label: "Receptionist", description: "Manage the appointment queue, patients, and basic billing." },
  [Role.PHARMACIST]: { label: "Pharmacist", description: "Manage prescriptions, pharmacy inventory, and related billing." },
  [Role.NURSE]: { label: "Nurse", description: "Assist with patient intake, vitals, and basic charting." },
  [Role.THERAPIST]: { label: "Therapist", description: "Manage therapy sessions and corresponding patient records." },
  [Role.LAB_TECHNICIAN]: { label: "Lab Technician", description: "Manage lab test requests, results, and diagnostics." },
  [Role.COUNSELOR]: { label: "Counselor", description: "Specialized mental health or guidance consulting." },
  [Role.SUPPORT_STAFF]: { label: "Support Staff", description: "General maintenance, help Requests and clinic utilities." },
  [Role.FINANCE_BILLING]: { label: "Finance & Billing", description: "Full financial control, invoices, payments and revenue analytics." },
  [Role.HR_MANAGER]: { label: "HR Manager", description: "Manage staff directory, payroll, and clinic human resources." },
};

const PERMISSION_GROUPS = [
  {
    name: "Appointments",
    keywords: ["APPOINTMENT", "QUEUE", "SCHEDULE"],
  },
  {
    name: "Patients & Clinical",
    keywords: ["PATIENT", "CLINICAL", "PRESCRIPTION", "VITALS", "MEDICAL", "CONSULTATION", "HISTORY", "RECORD"],
  },
  {
    name: "Billing & Finance",
    keywords: ["BILLING", "INVOICE", "PAYMENT", "REFUND", "SUBSCRIPTION", "PLAN", "FINANCE"],
  },
  {
    name: "Staff & RBAC",
    keywords: ["STAFF", "ROLE", "USER", "PERMISSION", "ACCESS"],
  },
  {
    name: "Clinic & Settings",
    keywords: ["CLINIC", "LOCATION", "SETTING", "SYSTEM", "LOG", "AUDIT", "CONFIG"],
  },
  {
    name: "Pharmacy & Labs",
    keywords: ["PHARMACY", "LAB", "INVENTORY", "TEST", "REPORTS"],
  },
];

interface AssignRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
    permissions?: string[];
  };
  currentUserRole: Role;
  clinicId?: string | undefined;
  onSuccess?: () => void;
}

export function AssignRoleModal({
  open,
  onOpenChange,
  staffMember,
  currentUserRole,
  clinicId,
  onSuccess,
}: AssignRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(
    (staffMember.role as Role) || Role.RECEPTIONIST
  );
  const [activeTab, setActiveTab] = useState("role");
  const [isActive, setIsActive] = useState<boolean>(
    staffMember.status !== "Inactive"
  );
  
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize permissions
  useEffect(() => {
    if (open && staffMember) {
      const initialPermissions = (staffMember.permissions as Permission[]) || 
                                (ROLE_PERMISSIONS[staffMember.role as Role] || []) as Permission[];
      setSelectedPermissions(initialPermissions);
      setSelectedRole((staffMember.role as Role) || Role.RECEPTIONIST);
    }
  }, [open, staffMember]);

  const isClinicAdmin = currentUserRole === Role.CLINIC_ADMIN;
  const assignableRoles = isClinicAdmin ? CLINIC_ADMIN_ASSIGNABLE_ROLES : ALL_STAFF_ROLES;

  const formatPermission = (p: string) => {
    return p.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const togglePermission = (perm: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm) 
        : [...prev, perm]
    );
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    // Ask user or just reset? Usually better to show what's changing
    const defaultPerms = (ROLE_PERMISSIONS[role] || []) as Permission[];
    setSelectedPermissions(defaultPerms);
  };

  const resetPermissions = () => {
    const defaultPerms = (ROLE_PERMISSIONS[selectedRole] || []) as Permission[];
    setSelectedPermissions(defaultPerms);
  };

  const getGroupedPermissions = () => {
    const grouped: Record<string, Permission[]> = {};
    const allPermissions = Object.values(Permission);
    
    // Filter and Group
    allPermissions.forEach(p => {
      // Apply search filter
      if (permissionSearch && !p.toLowerCase().includes(permissionSearch.toLowerCase()) && 
          !formatPermission(p).toLowerCase().includes(permissionSearch.toLowerCase())) {
        return;
      }

      let category = "Other Settings";
      PERMISSION_GROUPS.forEach(group => {
        if (group.keywords.some(k => p.includes(k))) {
          category = group.name;
        }
      });

      if (!grouped[category]) grouped[category] = [];
      grouped[category]!.push(p as Permission);
    });

    return grouped;
  };

  const groupedPermissions = getGroupedPermissions();

  const handleSave = async () => {
    setIsSubmitting(true);
    let updated = false;
    
    try {
      if (!staffMember) return;
      
      const currentPermissions = [...selectedPermissions].sort();
      const originalPermissions = [...((staffMember.permissions as Permission[]) || (ROLE_PERMISSIONS[staffMember.role as Role] || []))].sort();

      if (selectedRole !== (staffMember.role as Role) || 
          JSON.stringify(currentPermissions) !== JSON.stringify(originalPermissions)) {
        await updateUserRole(staffMember.id, selectedRole, {
          ...(clinicId && { clinicId }),
          permissions: selectedPermissions,
        });
        updated = true;
      }
      
      const wasActive = staffMember.status !== "Inactive";
      if (isActive !== wasActive) {
        await updateUser(staffMember.id, { isActive });
        updated = true;
      }

      if (updated) {
        showSuccessToast("Staff profile updated successfully", { id: TOAST_IDS.USER.UPDATE });
        onSuccess?.();
      }
      onOpenChange(false);
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to update staff",
        { id: TOAST_IDS.USER.UPDATE }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-[95vw] lg:max-w-6xl p-0 overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white dark:bg-neutral-950 h-[92vh] sm:h-[85vh] flex flex-col rounded-2xl">
        {/* Professional Header */}
        <div className="bg-white dark:bg-neutral-900 px-6 py-6 sm:px-8 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Assign Role & Permissions
                </DialogTitle>
                <DialogDescription className="text-sm text-neutral-500 font-medium flex items-center gap-2">
                  <span>{staffMember.name}</span>
                  <span className="opacity-40">•</span>
                  <span className="text-xs">{staffMember.email}</span>
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={cn(
                "px-4 py-2 rounded-xl flex items-center gap-3 border transition-colors",
                isActive 
                  ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
                  : "bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-emerald-500" : "bg-red-500")} />
                  <span className={cn("text-xs font-semibold", isActive ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                    {isActive ? "Active Account" : "Inactive Account"}
                  </span>
                </div>
                <Switch 
                  checked={isActive} 
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0 bg-neutral-50/50 dark:bg-neutral-900/10">
          {/* Navigation Sidebar */}
          <div className="hidden sm:flex w-64 lg:w-72 border-r border-neutral-200 dark:border-neutral-800 flex-col p-4 gap-4 shrink-0 bg-white dark:bg-neutral-900/50">
            <div className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Settings</h3>
              
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab("role")}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                    activeTab === "role" 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <UserCircle2 className="w-5 h-5 shrink-0" />
                  <div className="text-left overflow-hidden">
                    <span className="font-semibold text-sm block truncate">Basic Role</span>
                  </div>
                  {activeTab === "role" && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>

                <button 
                  onClick={() => setActiveTab("permissions")}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                    activeTab === "permissions" 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <Lock className="w-5 h-5 shrink-0" />
                  <div className="text-left overflow-hidden">
                    <span className="font-semibold text-sm block truncate">Permissions</span>
                  </div>
                  <Badge className={cn(
                    "ml-auto text-[10px] h-5 px-1.5 font-bold border-none",
                    activeTab === "permissions" ? "bg-white/20 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                  )}>
                    {selectedPermissions.length}
                  </Badge>
                </button>
              </div>
            </div>

            <div className="mt-auto p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Settings2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Current Selection</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 font-medium">Active Role</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {ROLE_INFO[selectedRole]?.label || selectedRole}
                </p>
              </div>
            </div>
          </div>

          {/* Main Space */}
          <div className="flex-1 bg-white dark:bg-neutral-950 flex flex-col overflow-hidden min-w-0">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 lg:p-10 pb-24">
                {activeTab === "role" && (
                  <div className="space-y-8">
                    <div className="border-b pb-6 border-neutral-100 dark:border-neutral-800">
                      <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Select Staff Role</h3>
                      <p className="text-sm text-neutral-500 mt-1">Assign a primary role to define the user's main responsibilities.</p>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignableRoles.map((role) => {
                        const info = ROLE_INFO[role] || { label: role, description: "Standard user role." };
                        const isSelected = selectedRole === role;
                        
                        return (
                          <div 
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleRoleChange(role);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "relative p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col gap-4 group",
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/5 translate-y-[-2px]" 
                                : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/40"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                isSelected ? "bg-primary text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                              )}>
                                <UserCircle2 className="w-5 h-5" />
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                                  <Check className="w-3.5 h-3.5 stroke-3" />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <h4 className={cn(
                                "font-bold text-sm",
                                isSelected ? "text-primary" : "text-neutral-900 dark:text-neutral-100"
                              )}>{info.label}</h4>
                              <p className="text-xs text-neutral-500 leading-normal line-clamp-2">{info.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "permissions" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between border-b pb-6 border-neutral-100 dark:border-neutral-800">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Custom Permissions</h3>
                        <p className="text-sm text-neutral-500 mt-1">Fine-tune individual module access for this user.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetPermissions}
                        className="rounded-xl font-semibold text-xs h-9 gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset to Default
                      </Button>
                    </div>
 
                    <div className="relative max-w-xl">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input 
                        placeholder="Search for a permission..." 
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="pl-10 h-11 bg-neutral-100/50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-primary/20 transition-all text-sm"
                      />
                    </div>
                    
                    <Accordion type="multiple" defaultValue={PERMISSION_GROUPS.map(g => g.name)} className="space-y-6">
                      {Object.entries(groupedPermissions).map(([groupName, perms]) => {
                        if (perms.length === 0) return null;
                        const selectedCount = perms.filter(p => selectedPermissions.includes(p)).length;
 
                        return (
                          <div key={groupName} className="space-y-3">
                            <AccordionItem value={groupName} className="border-none">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-sm text-neutral-700 dark:text-neutral-300">{groupName}</span>
                                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                                    {selectedCount} / {perms.length}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="text-[11px] font-bold text-primary hover:underline"
                                    onClick={() => {
                                      const newPerms = Array.from(new Set([...selectedPermissions, ...perms]));
                                      setSelectedPermissions(newPerms);
                                    }}
                                  >
                                    Select All
                                  </button>
                                  <span className="text-neutral-300 text-xs">|</span>
                                  <button
                                    type="button"
                                    className="text-[11px] font-bold text-neutral-400 hover:text-red-500"
                                    onClick={() => {
                                      setSelectedPermissions(prev => prev.filter(p => !perms.includes(p)));
                                    }}
                                  >
                                    Clear All
                                  </button>
                                </div>
                              </div>
                              
                              <AccordionTrigger className="hidden" />
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {perms.map((p) => {
                                  const isSelected = selectedPermissions.includes(p);
                                  const isDefault = (ROLE_PERMISSIONS[selectedRole] || []).includes(p);
                                  
                                  return (
                                    <div 
                                      key={p} 
                                      onClick={() => togglePermission(p)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          togglePermission(p);
                                        }
                                      }}
                                      role="button"
                                      tabIndex={0}
                                      className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer group/item",
                                        isSelected 
                                          ? "bg-primary/5 border-primary/20" 
                                          : "bg-white dark:bg-neutral-900/40 border-neutral-100 dark:border-neutral-800 hover:border-neutral-200"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                        isSelected 
                                          ? "bg-primary border-primary text-white" 
                                          : "border-neutral-200 dark:border-neutral-700"
                                      )}>
                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                                      </div>
                                      <div className="min-w-0">
                                        <span className={cn(
                                          "text-sm font-medium block truncate transition-colors",
                                          isSelected ? "text-primary" : "text-neutral-700 dark:text-neutral-300"
                                        )}>
                                          {formatPermission(p)}
                                        </span>
                                        {!isDefault && isSelected && (
                                          <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
                                            <Zap className="w-2.5 h-2.5 fill-amber-600" />
                                            Manual Override
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionItem>
                          </div>
                        );
                      })}
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <div className="shrink-0 px-8 py-5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-6 text-sm text-neutral-500 font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>{selectedPermissions.length} permissions configured</span>
            </div>
            {selectedPermissions.length > 0 && JSON.stringify([...selectedPermissions].sort()) !== JSON.stringify([...(ROLE_PERMISSIONS[selectedRole] || [])].sort()) && (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/20 gap-1 font-bold">
                <Zap className="w-3 h-3 fill-amber-600" />
                Custom Overrides Active
              </Badge>
            )}
          </div>
          
          <div className="flex flex-1 sm:flex-none items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 sm:flex-none rounded-xl font-bold text-xs px-6 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting} 
              className="flex-1 sm:flex-none rounded-xl font-bold text-xs px-8 h-11 shadow-lg shadow-primary/20 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
