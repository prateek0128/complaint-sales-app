import type { Complaint } from "../utils/data";

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  LoginUserId: undefined;
  LoginPhone: undefined;
  PhoneSignIn: undefined;
  Registration: undefined;
  Dashboard: undefined;
  RaiseComplaint: undefined;
  ComplaintDetails: { complaintId?: number | string; complaint?: Complaint };
  TechnicianOtp: { complaintId: number | string; technicianId: number | string };
  Feedback: { complaintId?: number | string; technicianId?: number | string };
};

export type DashboardTabParamList = {
  Home: undefined;
  Profile: undefined;
};
