"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";

export default function SpecializationsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("homepage.specializations.title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t("homepage.specializations.subtitle")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              {t("homepage.specializations.panchakarma.title")}
            </h3>
            <p className="text-gray-600">
              {t("homepage.specializations.panchakarma.description")}
            </p>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">
              {t("homepage.specializations.agnikarma.title")}
            </h3>
            <p className="text-gray-600">
              {t("homepage.specializations.agnikarma.description")}
            </p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">
              {t("homepage.specializations.viddhakarma.title")}
            </h3>
            <p className="text-gray-600">
              {t("homepage.specializations.viddhakarma.description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
