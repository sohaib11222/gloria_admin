import http from "../lib/http";
import { MW } from "./routes";
import { CompanyUpdateForm } from "../lib/validators";

export interface Company {
  id: string;
  companyName: string;
  email: string;
  type: "SOURCE" | "AGENT";
  status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  emailVerified?: boolean;
  companyCode?: string | null;
  adapterType?: string;
  grpcEndpoint?: string | null;
  httpEndpoint?: string | null;
  whitelistedDomains?: string | null;
  createdAt: string;
  updatedAt: string;
  users?: Array<{
    id: string;
    companyId: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  }>;
  agentAgreements?: any[];
  sourceAgreements?: any[];
  sourceLocations?: any[];
}

export interface CompanyListResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
}

export const companiesApi = {
  listCompanies: async (): Promise<CompanyListResponse> => {
    try {
      const response = await http.get(MW.companies.list());
      const items = (response.data?.items ?? response.data ?? []) as any[];
      const mapped: Company[] = items.map((it: any) => ({
        id: it.id,
        companyName: it.companyName,
        email: it.email,
        type: it.type,
        status: it.status,
        adapterType: it.adapterType,
        grpcEndpoint: it.grpcEndpoint,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        users: it.users,
        agentAgreements: it.agentAgreements,
        sourceAgreements: it.sourceAgreements,
        sourceLocations: it.sourceLocations,
      }));
      return {
        data: mapped,
        total: mapped.length,
        page: 1,
        limit: mapped.length,
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  listSources: async (): Promise<CompanyListResponse> => {
    const response = await http.get(MW.companies.list());
    const items = (response.data?.items ?? response.data ?? []) as any[];
    const mapped: Company[] = items
      .filter((it: any) => it.type === "SOURCE")
      .map((it: any) => ({
        id: it.id,
        companyName: it.companyName,
        email: it.email,
        type: it.type,
        status: it.status,
        adapterType: it.adapterType,
        grpcEndpoint: it.grpcEndpoint,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        users: it.users,
        agentAgreements: it.agentAgreements,
        sourceAgreements: it.sourceAgreements,
        sourceLocations: it.sourceLocations,
      }));
    return {
      data: mapped,
      total: mapped.length,
      page: 1,
      limit: mapped.length,
    };
  },

  listAgents: async (): Promise<CompanyListResponse> => {
    const response = await http.get(MW.companies.list());
    const items = (response.data?.items ?? response.data ?? []) as any[];
    const mapped: Company[] = items
      .filter((it: any) => it.type === "AGENT")
      .map((it: any) => ({
        id: it.id,
        companyName: it.companyName,
        email: it.email,
        type: it.type,
        status: it.status,
        adapterType: it.adapterType,
        grpcEndpoint: it.grpcEndpoint,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        users: it.users,
        agentAgreements: it.agentAgreements,
        sourceAgreements: it.sourceAgreements,
        sourceLocations: it.sourceLocations,
      }));
    return {
      data: mapped,
      total: mapped.length,
      page: 1,
      limit: mapped.length,
    };
  },

  getCompany: async (id: string): Promise<Company> => {
    const response = await http.get(MW.companies.get(id));
    return response.data;
  },

  updateCompanyStatus: async (
    id: string,
    status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED"
  ): Promise<Company> => {
    try {
      const response = await http.patch(MW.companies.updateStatus(id), { status });
      return response.data;
    } catch (error) {
      console.error('Error updating company status:', error);
      throw error;
    }
  },

  updateCompany: async (
    id: string,
    data: CompanyUpdateForm
  ): Promise<Company> => {
    const response = await http.patch(`/companies/${id}`, data);
    return response.data;
  },

  createCompany: async (data: Partial<Company>): Promise<Company> => {
    const response = await http.post("/admin/companies", data);
    return response.data;
  },

  updateCompanyDetails: async (
    id: string,
    data: Partial<Company>
  ): Promise<Company> => {
    const response = await http.put(`/admin/companies/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await http.delete(`/admin/companies/${id}`);
  },

  bulkUpdateStatus: async (companyIds: string[], status: string) => {
    const response = await http.patch("/admin/companies/bulk-status", {
      company_ids: companyIds,
      status,
    });
    return response.data;
  },

  // Health-related endpoints
  runHealthCheck: async (companyId: string) => {
    const response = await http.post(`/admin/health/check/${companyId}`);
    return response.data;
  },

  resetHealth: async (companyId?: string) => {
    const url = companyId
      ? `/admin/health/reset/${companyId}`
      : "/admin/health/reset";
    const response = await http.post(url);
    return response.data;
  },

  // Location sync
  syncLocations: async (companyId: string) => {
    const response = await http.post(`/admin/locations/sync/${companyId}`);
    return response.data;
  },

  // Branch import (for sources)
  importBranches: async (sourceId: string): Promise<{
    message: string;
    imported: number;
    updated: number;
    total: number;
  }> => {
    const response = await http.post(`/admin/sources/${sourceId}/import-branches`);
    return response.data;
  },
};
