import http from "../lib/http";

export interface Branch {
  id: string;
  sourceId: string;
  agreementId?: string | null;
  branchCode: string;
  name: string;
  status?: string | null;
  locationType?: string | null;
  collectionType?: string | null;
  email?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  addressLine?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
  natoLocode?: string | null;
  rawJson?: any;
  createdAt: string;
  updatedAt: string;
  source?: {
    id: string;
    companyName: string;
    companyCode: string | null;
  };
}

export interface BranchListResponse {
  items: Branch[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface BranchStats {
  total: number;
  unmapped: number;
  bySource: Array<{
    sourceId: string;
    sourceName: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface UpdateBranchRequest {
  name?: string;
  status?: string;
  locationType?: string;
  collectionType?: string;
  email?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  addressLine?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
  natoLocode?: string | null;
}

export const branchesApi = {
  listBranches: async (params?: {
    sourceId?: string;
    status?: string;
    locationType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<BranchListResponse> => {
    const response = await http.get("/admin/branches", { params });
    return response.data;
  },

  getBranch: async (id: string): Promise<Branch> => {
    const response = await http.get(`/admin/branches/${id}`);
    return response.data;
  },

  updateBranch: async (id: string, data: UpdateBranchRequest): Promise<Branch> => {
    const response = await http.patch(`/admin/branches/${id}`, data);
    return response.data;
  },

  deleteBranch: async (id: string): Promise<void> => {
    await http.delete(`/admin/branches/${id}`);
  },

  listUnmappedBranches: async (params?: {
    sourceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<BranchListResponse> => {
    const response = await http.get("/admin/branches/unmapped", { params });
    return response.data;
  },

  getBranchStats: async (sourceId?: string): Promise<BranchStats> => {
    const response = await http.get("/admin/branches/stats", {
      params: sourceId ? { sourceId } : {},
    });
    return response.data;
  },
};

