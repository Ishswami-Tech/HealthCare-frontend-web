"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity,
  Calendar, 
  Users,
  UserCheck,
  LogOut,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit,
  Eye,
  UserPlus,
  Clock,
  AlertCircle,
  Heart,
  Pill,
  Calendar as CalendarIcon
} from "lucide-react";

export default function ReceptionistPatients() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: ""
  });

  // Mock patient data
  const patients = [
    {
      id: "1",
      name: "Rajesh Kumar",
      phone: "+91 9876543210",
      email: "rajesh.kumar@email.com",
      age: 45,
      gender: "Male",
      address: "123 MG Road, Mumbai, MH 400001",
      registrationDate: "2023-06-15",
      lastVisit: "2024-01-15",
      nextAppointment: "2024-01-22",
      status: "Active",
      totalVisits: 12,
      emergencyContact: "Sunita Kumar (Wife)",
      emergencyPhone: "+91 9876543220",
      medicalHistory: ["Diabetes Type 2", "Hypertension", "Chronic back pain"],
      allergies: ["None known"],
      currentMedications: ["Metformin 500mg", "Amlodipine 5mg", "Yogaraja Guggulu"],
      recentVisits: [
        { date: "2024-01-15", type: "Panchakarma", doctor: "Dr. Priya", status: "Completed" },
        { date: "2024-01-08", type: "Consultation", doctor: "Dr. Priya", status: "Completed" },
        { date: "2024-01-01", type: "Follow-up", doctor: "Dr. Priya", status: "Completed" }
      ],
      paymentStatus: "Paid",
      insuranceInfo: "Star Health Insurance - Policy #SH123456"
    },
    {
      id: "2",
      name: "Priya Sharma", 
      phone: "+91 9876543211",
      email: "priya.sharma@email.com",
      age: 32,
      gender: "Female",
      address: "456 Park Street, Delhi, DL 110001",
      registrationDate: "2023-08-20",
      lastVisit: "2024-01-12",
      nextAppointment: "2024-01-19",
      status: "Active",
      totalVisits: 8,
      emergencyContact: "Amit Sharma (Husband)",
      emergencyPhone: "+91 9876543221",
      medicalHistory: ["PCOS", "Iron deficiency anemia"],
      allergies: ["Tree nuts", "Shellfish"],
      currentMedications: ["Ashokarishtam", "Iron supplements", "Triphala Churna"],
      recentVisits: [
        { date: "2024-01-12", type: "Nadi Pariksha", doctor: "Dr. Amit", status: "Completed" },
        { date: "2024-01-05", type: "Consultation", doctor: "Dr. Amit", status: "Completed" }
      ],
      paymentStatus: "Pending",
      insuranceInfo: "HDFC Ergo - Policy #HE789012"
    },
    {
      id: "3",
      name: "Vikram Singh",
      phone: "+91 9876543212", 
      email: "vikram.singh@email.com",
      age: 28,
      gender: "Male",
      address: "789 Brigade Road, Bangalore, KA 560001",
      registrationDate: "2023-11-10",
      lastVisit: "2024-01-10",
      nextAppointment: null,
      status: "Inactive",
      totalVisits: 4,
      emergencyContact: "Meera Singh (Mother)",
      emergencyPhone: "+91 9876543222",
      medicalHistory: ["Anxiety disorder", "Insomnia"],
      allergies: ["Dairy products"],
      currentMedications: ["Ashwagandha capsules", "Brahmi Ghrita"],
      recentVisits: [
        { date: "2024-01-10", type: "Shirodhara", doctor: "Dr. Ravi", status: "Completed" },
        { date: "2023-12-15", type: "Consultation", doctor: "Dr. Ravi", status: "Completed" }
      ],
      paymentStatus: "Paid",
      insuranceInfo: "None"
    },
    {
      id: "4",
      name: "Anita Desai",
      phone: "+91 9876543213",
      email: "anita.desai@email.com", 
      age: 55,
      gender: "Female",
      address: "321 FC Road, Pune, MH 411005",
      registrationDate: "2023-04-05",
      lastVisit: "2024-01-14",
      nextAppointment: "2024-01-20",
      status: "Active",
      totalVisits: 15,
      emergencyContact: "Rahul Desai (Son)",
      emergencyPhone: "+91 9876543223",
      medicalHistory: ["Arthritis", "Menopause", "Osteoporosis"],
      allergies: ["Aspirin"],
      currentMedications: ["Maharasnadi Kwath", "Calcium supplements", "Vitamin D3"],
      recentVisits: [
        { date: "2024-01-14", type: "Agnikarma", doctor: "Dr. Priya", status: "Completed" },
        { date: "2024-01-07", type: "Follow-up", doctor: "Dr. Priya", status: "Completed" }
      ],
      paymentStatus: "Paid",
      insuranceInfo: "LIC Health - Policy #LH345678"
    }
  ];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleNewPatientSubmit = () => {
    console.log("Creating new patient:", newPatient);
    setShowNewPatientDialog(false);
    // Reset form
    setNewPatient({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      medicalHistory: "",
      allergies: "",
      currentMedications: ""
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sidebarLinks = getRoutesByRole(Role.RECEPTIONIST).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('patients') ? <Users className="w-5 h-5" /> :
          route.path.includes('profile') ? <UserCheck className="w-5 h-5" /> :
          <Activity className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Patient Management" allowedRole={Role.RECEPTIONIST}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Receptionist",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Patient Management</h1>
            <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Patient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newPatient.firstName}
                        onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newPatient.lastName}
                        onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newPatient.dateOfBirth}
                        onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={newPatient.gender} 
                        onValueChange={(value) => setNewPatient({...newPatient, gender: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={newPatient.emergencyContact}
                        onChange={(e) => setNewPatient({...newPatient, emergencyContact: e.target.value})}
                        placeholder="Name (Relationship)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={newPatient.emergencyPhone}
                        onChange={(e) => setNewPatient({...newPatient, emergencyPhone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      value={newPatient.medicalHistory}
                      onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                      placeholder="Any existing medical conditions..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Input
                      id="allergies"
                      value={newPatient.allergies}
                      onChange={(e) => setNewPatient({...newPatient, allergies: e.target.value})}
                      placeholder="Food, drug, or other allergies..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentMedications">Current Medications</Label>
                    <Textarea
                      id="currentMedications"
                      value={newPatient.currentMedications}
                      onChange={(e) => setNewPatient({...newPatient, currentMedications: e.target.value})}
                      placeholder="List current medications with dosage..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowNewPatientDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleNewPatientSubmit}>
                      Register Patient
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
                <p className="text-xs text-muted-foreground">Registered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.status === 'Active').length}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <UserPlus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">8</div>
                <p className="text-xs text-muted-foreground">Registrations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {patients.filter(p => p.paymentStatus === 'Pending').length}
                </div>
                <p className="text-xs text-muted-foreground">Need follow-up</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-xl">
                          {patient.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{patient.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {patient.email}
                          </span>
                          <span>{patient.age} years • {patient.gender}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{patient.address}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(patient.paymentStatus)}>
                            {patient.paymentStatus}
                          </Badge>
                          <Badge variant="outline">
                            {patient.totalVisits} visits
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="text-sm">
                        <div><strong>Last Visit:</strong> {new Date(patient.lastVisit).toLocaleDateString()}</div>
                        {patient.nextAppointment && (
                          <div><strong>Next:</strong> {new Date(patient.nextAppointment).toLocaleDateString()}</div>
                        )}
                        <div><strong>Registered:</strong> {new Date(patient.registrationDate).toLocaleDateString()}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPatient(patient)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Patient Details: {selectedPatient?.name}</DialogTitle>
                            </DialogHeader>
                            {selectedPatient && (
                              <div className="space-y-6">
                                {/* Personal Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Personal Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div><strong>Full Name:</strong> {selectedPatient.name}</div>
                                    <div><strong>Age:</strong> {selectedPatient.age} years</div>
                                    <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                                    <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                                    <div><strong>Email:</strong> {selectedPatient.email}</div>
                                    <div><strong>Registration:</strong> {new Date(selectedPatient.registrationDate).toLocaleDateString()}</div>
                                    <div className="col-span-2"><strong>Address:</strong> {selectedPatient.address}</div>
                                  </CardContent>
                                </Card>

                                {/* Emergency Contact */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Emergency Contact</CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div><strong>Contact:</strong> {selectedPatient.emergencyContact}</div>
                                    <div><strong>Phone:</strong> {selectedPatient.emergencyPhone}</div>
                                  </CardContent>
                                </Card>

                                {/* Medical Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <Heart className="w-5 h-5" />
                                      Medical Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <strong>Medical History:</strong>
                                      <div className="mt-1 space-y-1">
                                        {selectedPatient.medicalHistory.map((condition: string, index: number) => (
                                          <div key={index} className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            <span className="text-sm">{condition}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <strong>Allergies:</strong>
                                      <div className="mt-1 space-y-1">
                                        {selectedPatient.allergies.map((allergy: string, index: number) => (
                                          <div key={index} className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-sm">{allergy}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <strong>Current Medications:</strong>
                                      <div className="mt-1 space-y-1">
                                        {selectedPatient.currentMedications.map((medication: string, index: number) => (
                                          <div key={index} className="flex items-center gap-2">
                                            <Pill className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm">{medication}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Recent Visits */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <Clock className="w-5 h-5" />
                                      Recent Visits
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {selectedPatient.recentVisits.map((visit: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                          <div>
                                            <div className="font-medium">{visit.type}</div>
                                            <div className="text-sm text-gray-600">with {visit.doctor}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm">{new Date(visit.date).toLocaleDateString()}</div>
                                            <Badge className={visit.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                              {visit.status}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Insurance & Payment */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Insurance & Payment Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div><strong>Payment Status:</strong> 
                                      <Badge className={getPaymentStatusColor(selectedPatient.paymentStatus)} variant="outline">
                                        {selectedPatient.paymentStatus}
                                      </Badge>
                                    </div>
                                    <div><strong>Total Visits:</strong> {selectedPatient.totalVisits}</div>
                                    <div className="col-span-2"><strong>Insurance:</strong> {selectedPatient.insuranceInfo}</div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button size="sm">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          Book
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No patients found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}

