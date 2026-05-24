"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield } from "lucide-react";

interface ReceptionistProfileSecurityTabProps {
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
}

export function ReceptionistProfileSecurityTab({
  showPassword,
  setShowPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
}: ReceptionistProfileSecurityTabProps) {
  return (
    <div className="gap-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-y-4">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button className="w-full" type="button">
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-y-3 text-sm">
            <div className="flex justify-between">
              <span>Last Password Change:</span>
              <span className="text-muted-foreground">45 days ago</span>
            </div>
            <div className="flex justify-between">
              <span>Two-Factor Authentication:</span>
              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                Disabled
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Session Timeout:</span>
              <span className="text-muted-foreground">4 hours</span>
            </div>
            <div className="flex justify-between">
              <span>Active Sessions:</span>
              <span className="text-muted-foreground">2 devices</span>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <Button variant="outline" className="w-full" type="button">
              Enable Two-Factor Authentication
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
