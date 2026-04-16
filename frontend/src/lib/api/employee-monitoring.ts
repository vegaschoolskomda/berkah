import api from './client';

export type EmployeeMonitoringListItem = {
  userId: number;
  userName: string;
  userEmail: string;
  roleName: string;
  currentPath: string | null;
  currentPageTitle: string | null;
  lastSeenAt: string | null;
  isOnline: boolean;
  historyCount: number;
};

export type EmployeeMonitoringHistoryResponse = {
  user: {
    userId: number;
    userName: string;
    userEmail: string;
    roleName: string;
  };
  currentPath: string | null;
  currentPageTitle: string | null;
  lastSeenAt: string | null;
  isOnline: boolean;
  history: Array<{
    path: string;
    pageTitle: string;
    visitedAt: string;
  }>;
};

export const pingEmployeeActivity = async (data: { path: string; pageTitle?: string }) =>
  (await api.post('/employee-monitoring/ping', data)).data;

export const getEmployeeMonitoringList = async (): Promise<EmployeeMonitoringListItem[]> =>
  (await api.get('/employee-monitoring/employees')).data;

export const getEmployeeMonitoringHistory = async (
  userId: number,
  limit = 100,
): Promise<EmployeeMonitoringHistoryResponse> =>
  (await api.get(`/employee-monitoring/employees/${userId}/history?limit=${limit}`)).data;
