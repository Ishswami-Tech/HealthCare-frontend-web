"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Phone, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleMapsProps {
  address: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  className?: string;
  height?: string;
  showInfoWindow?: boolean;
  clinicName?: string;
  clinicPhone?: string;
  clinicHours?: string;
  apiKey?: string;
}

interface ClinicLocation {
  name: string;
  address: string;
  phone: string;
  hours: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Default clinic location for Shri Vishwamurthi Ayurvedalay
const DEFAULT_CLINIC: ClinicLocation = {
  name: 'Shri Vishwamurthi Ayurvedalay',
  address: 'Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra, India',
  phone: '9860370961, 7709399925',
  hours: 'Mon-Fri: 11:45 AM – 11:30 PM',
  coordinates: {
    lat: 18.6298, // Approximate coordinates for Chinchwad, Pune
    lng: 73.7997,
  },
};

export function GoogleMaps({
  address,
  latitude,
  longitude,
  zoom = 15,
  className,
  height = '400px',
  showInfoWindow = true,
  clinicName = DEFAULT_CLINIC.name,
  clinicPhone = DEFAULT_CLINIC.phone,
  clinicHours = DEFAULT_CLINIC.hours,
  apiKey,
}: GoogleMapsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const lat = latitude || DEFAULT_CLINIC.coordinates.lat;
  const lng = longitude || DEFAULT_CLINIC.coordinates.lng;

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if Google Maps API is loaded
        if (typeof window.google === 'undefined') {
          // Load Google Maps API if not already loaded
          await loadGoogleMapsAPI();
        }

        if (!mapRef.current || !(window as any).google) return;

        // Create map instance
        const map = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        // Create marker
        const marker = new (window as any).google.maps.Marker({
          position: { lat, lng },
          map,
          title: clinicName,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2ZM16 13C14.3 13 13 11.7 13 10S14.3 7 16 7S19 8.3 19 10S17.7 13 16 13Z" fill="#059669"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(32, 32),
          },
        });

        // Create info window if enabled
        if (showInfoWindow) {
          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; max-width: 300px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${clinicName}</h3>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${address}</p>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <svg width="16" height="16" fill="#059669" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span style="font-size: 14px; color: #374151;">${clinicPhone}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <svg width="16" height="16" fill="#059669" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span style="font-size: 14px; color: #374151;">${clinicHours}</span>
                </div>
                <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')" 
                        style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; width: 100%;">
                  Get Directions
                </button>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          // Open info window by default
          infoWindow.open(map, marker);
        }

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    initMap();
  }, [lat, lng, zoom, address, clinicName, clinicPhone, clinicHours, showInfoWindow]);

  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.google !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));

      document.head.appendChild(script);
    });
  };

  const handleGetDirections = () => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCallClinic = () => {
    const phoneNumber = clinicPhone?.split(',')[0]?.trim().replace(/\s/g, '') || clinicPhone;
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  if (hasError) {
    return (
      <div className={cn(
        "bg-gray-100 rounded-lg overflow-hidden border border-gray-200",
        className
      )} style={{ height }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map unavailable</h3>
            <p className="text-gray-600 mb-4">Unable to load the map at this time</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGetDirections}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </button>
              <p className="text-sm text-gray-500">{address}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-gray-100 rounded-lg overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      <div ref={mapRef} style={{ height }} className="w-full" />

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleGetDirections}
          className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
          title="Get Directions"
        >
          <Navigation className="w-5 h-5 text-green-600" />
        </button>
        <button
          type="button"
          onClick={handleCallClinic}
          className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
          title="Call Clinic"
        >
          <Phone className="w-5 h-5 text-green-600" />
        </button>
      </div>

      {/* Clinic Info Card */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{clinicName}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{address}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <Clock className="w-4 h-4" />
                <span>{clinicHours}</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Phone className="w-4 h-4" />
                <span>{clinicPhone?.split(',')[0]?.trim() || clinicPhone}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGetDirections}
            className="ml-3 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            Directions
          </button>
        </div>
      </div>
    </div>
  );
}
