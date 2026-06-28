import { api } from './api';

export interface StatsData {
  noteCount: number;
  knowledgePointCount: number;
  reviewRecordCount: number;
  weakDomainCount: number;
  todayReviewCount: number;
}

export const statsApi = {
  getStats: () => api.get<StatsData>('/stats').then((res) => res.data),
};
