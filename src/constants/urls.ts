//export const BASE_URL = "https://api.maheshwariinfotechmtr.com/";
// For local testing, uncomment the LAN URL below and rebuild.
export const BASE_URL = "http://192.168.1.22:5001/";

// export const PUBLIC_INVOICE_CREATE_URL = "https://maheshwariinfotechmtr.com/create-invoice";

export const URLS = {
  login: "user/accountLogin",
  loginWithUserId: "user/loginWithUserID",
  raisedComplaint: "complaint/raiseComplaint",
  itemsCategory: "category/fetchItem",
  showComplaintDetails: "complaint/complaintDetailsAPP?",
  fetchAllComplaint: "customer/complaints?",
  fetchAllComplaintTechnician: "technician/complaintsAssigned?",
  getInfo: "user/getInfo?",
  deleteComplaint: "customer/cancelComplaint?",
  resolveComplaint: "complaintResolved",
  assignTechDetails: "complaint/assigned-tech-Details?",
  invoiceGenerate: "invoice/generate-invoice",
  complaintFeedback: "complaint/createfeedback",
  newRegistration: "customer/newCustomer",
  sendNotification: "notification/send",
  subscribeNotificationTopic: "notification/subscribe"
};
