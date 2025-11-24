import http from "../lib/http";

export interface LocationRequest {
  id: string;
  sourceId: string;
  source?: {
    id: string;
    companyName: string;
    companyCode: string | null;
  };
  locationName: string;
  country: string;
  city?: string | null;
  address?: string | null;
  iataCode?: string | null;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface LocationRequestListResponse {
  items: LocationRequest[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface UpdateLocationRequestRequest {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string | null;
}

export const locationRequestsApi = {
  listRequests: async (params?: {
    sourceId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<LocationRequestListResponse> => {
    const response = await http.get("/admin/locations/requests", { params });
    return response.data;
  },

  getRequest: async (id: string): Promise<LocationRequest> => {
    const response = await http.get(`/admin/locations/requests/${id}`);
    return response.data;
  },

  updateRequest: async (
    id: string,
    data: UpdateLocationRequestRequest
  ): Promise<LocationRequest> => {
    const response = await http.patch(`/admin/locations/requests/${id}`, data);
    return response.data;
  },

  approveRequest: async (
    id: string,
    adminNotes?: string
  ): Promise<LocationRequest> => {
    const response = await http.post(`/admin/locations/requests/${id}/approve`, {
      adminNotes,
    });
    return response.data;
  },

  rejectRequest: async (
    id: string,
    adminNotes?: string
  ): Promise<LocationRequest> => {
    const response = await http.post(`/admin/locations/requests/${id}/reject`, {
      adminNotes,
    });
    return response.data;
  },
};

