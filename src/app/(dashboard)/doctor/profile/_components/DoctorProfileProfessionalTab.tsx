"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DoctorProfileFormState } from "./doctor-profile.types";

interface DoctorProfileProfessionalTabProps {
  profileData: DoctorProfileFormState;
  updateProfessionalInfo: (field: string, value: unknown) => void;
}

export function DoctorProfileProfessionalTab({
  profileData,
  updateProfessionalInfo,
}: DoctorProfileProfessionalTabProps) {
  return (
    <div className="flex flex-col gap-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="size-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="medicalLicense">Medical License</Label>
              <Input
                id="medicalLicense"
                value={profileData.professionalInfo.medicalLicense}
                onChange={(e) =>
                  updateProfessionalInfo("medicalLicense", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                value={profileData.professionalInfo.experience}
                onChange={(e) =>
                  updateProfessionalInfo("experience", e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <Label>Specializations</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profileData.professionalInfo.specializations.map((spec, index) => (
                <Badge key={spec} variant="outline" className="flex items-center gap-1">
                  {spec}
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    className="size-4 p-0 hover:bg-red-100"
                    onClick={() => {
                      const newSpecs =
                        profileData.professionalInfo.specializations.filter(
                          (_, i) => i !== index,
                        );
                      updateProfessionalInfo("specializations", newSpecs);
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
              <Button variant="outline" size="sm" type="button">
                + Add Specialization
              </Button>
            </div>
          </div>

          <div>
            <Label>Languages Spoken</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profileData.professionalInfo.languagesSpoken.map((lang) => (
                <Badge key={lang} variant="outline">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Education & Certifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-4">
          <div>
            <h4 className="mb-2 font-semibold">Education</h4>
            {profileData.professionalInfo.education.map((edu) => (
              <div
                key={`${edu.degree}-${edu.institution}-${edu.year}`}
                className="mb-2 flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{edu.degree}</div>
                  <div className="text-sm text-gray-600">
                    {edu.institution} • {edu.year}
                  </div>
                </div>
                <Button variant="ghost" size="sm" type="button">
                  <Edit className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" type="button">
              + Add Education
            </Button>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Certifications</h4>
            {profileData.professionalInfo.certifications.map((cert) => (
              <div
                key={cert}
                className="mb-2 flex items-center justify-between rounded-lg border p-3"
              >
                <div className="font-medium">{cert}</div>
                <Button variant="ghost" size="sm" type="button">
                  <Edit className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" type="button">
              + Add Certification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
