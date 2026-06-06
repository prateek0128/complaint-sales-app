import axios from "axios";
import { BASE_URL, URLS } from "../constants/urls";
import { storage } from "../utils/storage";

export type UploadImage = { uri: string; name: string; type: string };

const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: status => status < 500
});

api.interceptors.request.use(async config => {
  const token = await storage.getToken();
  config.headers.Authorization = token ? `Bearer ${token}` : "";
  return config;
});

export async function loginWithUserId(phoneNumber: string, password: string) {
  return api.post(URLS.loginWithUserId, { phoneNumber, password });
}

export async function loginWithPhone(phoneNumber: string) {
  return api.post(URLS.login, { phoneNumber });
}

export async function registerCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  contact: string;
  location: string;
  profileImage?: UploadImage | null;
}) {
  const form = new FormData();
  form.append(
    "data",
    JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      age: 26,
      gender: data.gender,
      contact: data.contact,
      location: data.location
    })
  );
  if (data.profileImage) form.append("file", data.profileImage as unknown as Blob);
  return api.post(URLS.newRegistration, form, { headers: { "Content-Type": "multipart/form-data" } });
}

export async function getInfo(id: number, accountType: number, phoneNumber: string) {
  return api.get(`${URLS.getInfo}id=${id}&accountType=${accountType}&phoneNumber=${phoneNumber}`);
}

export async function fetchCustomerComplaints(customerId: number) {
  return api.get(`${URLS.fetchAllComplaint}id=${customerId}`);
}

export async function fetchTechnicianComplaints(technicianId: number) {
  return api.get(`${URLS.fetchAllComplaintTechnician}id=${technicianId}`);
}

export async function fetchComplaintDetails(complaintId: number) {
  return api.get(`${URLS.showComplaintDetails}id=${complaintId}`);
}

export async function fetchItemCategories() {
  return api.get(URLS.itemsCategory);
}

export async function raiseComplaint(data: {
  customerName: string;
  description: string;
  item: string;
  contact: string;
  address: string;
  warranty: number;
  customerId: number;
  itemImage: UploadImage;
  billImage?: UploadImage | null;
}) {
  const form = new FormData();
  form.append(
    "data",
    JSON.stringify({
      customerId: data.customerId,
      customerName: data.customerName,
      description: data.description,
      item: data.item,
      contact: data.contact,
      address: data.address,
      warranty: data.warranty
    })
  );
  form.append("itemImage", data.itemImage as unknown as Blob);
  if (data.billImage) form.append("billImage", data.billImage as unknown as Blob);
  return api.post(URLS.raisedComplaint, form, { headers: { "Content-Type": "multipart/form-data" } });
}

export async function deleteComplaint(complaintId: number) {
  return api.patch(`${URLS.deleteComplaint}ComplaintId=${complaintId}`);
}

export async function resolveComplaint(technicianId: number, complaintId: number, otp: number) {
  return api.post(URLS.resolveComplaint, { technicianId, complaintId, otp });
}

export async function generateInvoice(complaintId: number, repairParts: unknown[]) {
  return api.post(URLS.invoiceGenerate, { ComplaintId: complaintId, repairParts });
}

export async function submitFeedback(starRating: number, feedbackMsg: string, technicianId: number, complaintId: number) {
  return api.post(URLS.complaintFeedback, { starRating, feedbackMsg, technicianId, complaintId });
}
