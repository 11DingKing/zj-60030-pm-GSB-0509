import http from '@/utils/http';

export interface BurnDownData {
  sprint: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  totalStoryPoints: number;
  idealLine: Array<{ date: string; remaining: number }>;
  actualLine: Array<{ date: string; remaining: number }>;
}

export interface VelocityData {
  project: {
    id: string;
    name: string;
  };
  velocityData: Array<{
    sprintName: string;
    completedPoints: number;
    plannedPoints: number;
  }>;
  averageVelocity: number;
}

export interface WorklogData {
  project: {
    id: string;
    name: string;
  };
  memberWorklogs: Array<{
    id: string;
    name: string;
    avatar?: string;
    totalHours: number;
  }>;
  totalHours: number;
}

export interface BugTrendData {
  project: {
    id: string;
    name: string;
  };
  bugData: Array<{
    sprintName: string;
    totalBugs: number;
    resolvedBugs: number;
    unresolvedBugs: number;
  }>;
  sprintsCount: number;
}

export const statisticsApi = {
  getBurnDown: (sprintId: string): Promise<BurnDownData> => {
    return http.get(`/statistics/burndown/${sprintId}`);
  },

  getVelocity: (projectId: string): Promise<VelocityData> => {
    return http.get('/statistics/velocity', { params: { projectId } });
  },

  getWorklog: (projectId: string): Promise<WorklogData> => {
    return http.get('/statistics/worklog', { params: { projectId } });
  },

  getBugTrend: (projectId: string): Promise<BugTrendData> => {
    return http.get('/statistics/bugs', { params: { projectId } });
  },
};
