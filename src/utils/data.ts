// complaint-sales-app/src/utils/data.ts

export type Complaint = {
  complaintId?: number | string;
  customerId?: number | string;
  customerName?: string;
  technicianId?: number | string;
  description?: string;
  status?: string;
  item?: string;
  itemType?: string;
  itemImage?: string;
  billImage?: string;
  address?: string;
  location?: string;
  contact?: string;
  email?: string;
  otp?: number | string;
  createdAt?: string;
  updatedAt?: string;
  productsAssigned?: Array<{ repairPart?: string; description?: string; quantityAssigned?: number }>;
};

// Maps raw MySQL column names (PascalCase/snake_case) → camelCase Complaint type
function mapComplaint(raw: Record<string, unknown>): Complaint {
  return {
    complaintId:   raw.Complaint_Id   ?? raw.complaintId,
    customerId:    raw.Customer_Id    ?? raw.customerId,
    customerName:  raw.Customer_Name  ?? raw.customerName  ?? String(raw.Customer_Name ?? ""),
    description:   raw.Description    ?? raw.description,
    status:        raw.Status         ?? raw.status,
    item:          raw.Item           ?? raw.item,
    itemImage:     raw.Item_Image     ?? raw.itemImage,
    billImage:     raw.Bill_Image     ?? raw.billImage,
    address:       raw.Address        ?? raw.address,
    contact:       raw.Contact        ?? raw.contact,
    otp:           raw.Otp            ?? raw.otp,
    createdAt:     raw.CreatedAt      ?? raw.createdAt,
    updatedAt:     raw.UpdatedAt      ?? raw.updatedAt,
  } as Complaint;
}

export function pickList(data: unknown): Complaint[] {
  const value = data as Record<string, unknown>;
  const candidates = [
    value.Complaints,             // customer complaints
    value.TechnicianComplaints,   // technician complaints
    value.data,
    value.complaints,
    value.result,
    value.complaint,
    value.customerComplaints,
    value.technicianComplaints,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return (candidate as Record<string, unknown>[]).map(mapComplaint);
    }
    if (candidate && typeof candidate === "object") {
      const nested = Object.values(candidate as Record<string, unknown>).find(Array.isArray);
      if (Array.isArray(nested)) {
        return (nested as Record<string, unknown>[]).map(mapComplaint);
      }
    }
  }
  return Array.isArray(data)
    ? (data as Record<string, unknown>[]).map(mapComplaint)
    : [];
}

export function pickObject<T extends Record<string, unknown>>(data: unknown): T {
  const value = data as Record<string, unknown>;
  // getInfo returns { Details: [{ First_Name, Last_Name, Profile_Picture, ... }] }
  if (Array.isArray(value.Details) && value.Details.length > 0) {
    return value.Details[0] as T;
  }
  if (value.data && typeof value.data === "object" && !Array.isArray(value.data)) {
    return value.data as T;
  }
  return value as T;
}
export function formatDateTime(value?: string) {
  if (!value) return { date: "NA", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "NA", time: "" };
  return {
    date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
  };
}

export function statusColor(status?: string) {
  switch (status) {
    case "Completed":
      return "#22c55e";
    case "InProgress":
      return "#f59e0b";
    case "pending":
    case "Pending":
      return "#ef4444";
    default:
      return "#b6b6c2";
  }
}
