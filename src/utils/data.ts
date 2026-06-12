// complaint-sales-app/src/utils/data.ts

export type Complaint = {
  complaintId?: number | string;
  customerId?: number | string;
  customerName?: string;
  technicianId?: number | string;
  technicianName?: string;
  technicianContact?: string;
  subscribeToken?: string;
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

export function mapComplaint(raw: Record<string, unknown>): Complaint {
  const productsRaw = Array.isArray(raw.ProductsAssigned) ? raw.ProductsAssigned : (Array.isArray(raw.productsAssigned) ? raw.productsAssigned : undefined);
  
  const mappedProducts = productsRaw?.map((p: any) => ({
    repairPart: p.Repair_Part ?? p.repairPart,
    description: p.Description ?? p.description,
    quantityAssigned: p.Quantity_Assigned ?? p.quantityAssigned,
    wireLength: p.Wire_Length ?? p.wireLength
  }));

  const complaint: any = {
    complaintId:   raw.Complaint_Id   ?? raw.complaintId,
    customerId:    raw.Customer_Id    ?? raw.customerId,
    technicianId:  raw.Technician_Id  ?? raw.technicianId,
    customerName:  raw.Customer_Name  ?? raw.customerName  ?? String(raw.Customer_Name ?? ""),
    description:   raw.Description    ?? raw.description,
    status:        raw.Status         ?? raw.status,
    item:          raw.Item           ?? raw.item,
    itemType:      raw.Item_Type      ?? raw.itemType,
    itemImage:     raw.Item_Image     ?? raw.itemImage,
    billImage:     raw.Bill_Image     ?? raw.billImage,
    address:       raw.Address        ?? raw.address,
    location:      raw.Location       ?? raw.location,
    contact:       raw.Contact        ?? raw.contact,
    email:         raw.Email          ?? raw.email,
    subscribeToken: raw.SubscribeToken ?? raw.subscribeToken,
    otp:           raw.Otp            ?? raw.otp,
    createdAt:     raw.CreatedAt      ?? raw.createdAt      ?? raw.Created_At,
    updatedAt:     raw.UpdatedAt      ?? raw.updatedAt,
    productsAssigned: mappedProducts,
  };

  // Remove undefined properties so spreading doesn't overwrite existing valid data
  Object.keys(complaint).forEach(key => {
    if (complaint[key as keyof typeof complaint] === undefined) {
      delete complaint[key as keyof typeof complaint];
    }
  });

  return complaint as unknown as Complaint;
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
  // Envelopes that wrap a single object inside an array.
  // getInfo       → { Details: [...] }
  // complaint/:id → { ComplaintDetails: [...] }   (note PascalCase in backend)
  // assigned-tech → { TechnicicanDetails: [...] }  (typo preserved from backend)
  const arrayEnvelopes = ["Details", "ComplaintDetails", "TechnicicanDetails", "TechnicianDetails", "result"];
  for (const key of arrayEnvelopes) {
    const candidate = value[key];
    if (Array.isArray(candidate) && candidate.length > 0 && typeof candidate[0] === "object") {
      return candidate[0] as T;
    }
  }
  // Envelopes that wrap a single object directly under `data`.
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
