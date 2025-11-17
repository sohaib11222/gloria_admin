export const MW = {
  health: () => `/health`,
  uiConfig: () => `/ui/config`,
  
  // Admin test routes (existing)
  testSourceGrpc: () => `/admin/test/source-grpc`,
  testAgentGrpc: () => `/admin/test/agent-grpc`,
  
  
  agent: {
    ping: () => `/admin/grpc/agent/ping`,
    runCheck: () => `/admin/grpc/agent/run-check`,
    tokenGet: () => `/admin/agent-token`,
    tokenPost: () => `/admin/agent-token`,
    tokenDel: () => `/admin/agent-token`,
  },
  
  // Agreements (graceful fallback to local)
  agreementsTemplate: {
    get: () => `/admin/agreements/template`,   // optional
    accept: () => `/admin/agreements/accept`,   // optional
    status: () => `/admin/agreements/status`,   // optional
  },
  
  // Companies management
  companies: {
    list: () => `/admin/companies`,
    get: (id: string) => `/admin/companies/${id}`,
    updateStatus: (id: string) => `/admin/companies/${id}/status`,
  },
  
  // Agreements management
  agreements: {
    list: () => `/agreements`,
    get: (id: string) => `/agreements/${id}`,
    activate: (id: string) => `/agreements/${id}/activate`,
    suspend: (id: string) => `/agreements/${id}/suspend`,
    expire: (id: string) => `/agreements/${id}/expire`,
  },
} as const
