import { ReportIssuePayload } from '@/types/contentHub';

export interface ReportItemRecord extends ReportIssuePayload {
  id: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

const STORAGE_REPORTS = 'sihu_moderation_reports_v1';

export const moderationService = {
  /**
   * Submit an issue report
   */
  async submitReport(payload: ReportIssuePayload): Promise<ReportItemRecord> {
    const reports = this.getReports();
    const newReport: ReportItemRecord = {
      ...payload,
      id: `rep-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    reports.unshift(newReport);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_REPORTS, JSON.stringify(reports));
      } catch {
        // safe fallback
      }
    }
    return newReport;
  },

  /**
   * Get all moderation reports
   */
  getReports(): ReportItemRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_REPORTS);
      return raw ? JSON.parse(raw) : [
        {
          id: 'rep-demo-01',
          contentItemId: 'sihu-art-01',
          reporterEmail: 'reader@example.com',
          issueType: 'broken_link',
          description: 'The secondary link to the KMFRI report returns a 404 error during evening hours.',
          status: 'pending',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        }
      ];
    } catch {
      return [];
    }
  },

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string,
    status: ReportItemRecord['status'],
    resolutionNotes?: string
  ): Promise<ReportItemRecord | null> {
    const reports = this.getReports();
    const target = reports.find((r) => r.id === reportId);
    if (!target) return null;

    target.status = status;
    if (resolutionNotes) target.resolutionNotes = resolutionNotes;
    if (status === 'resolved' || status === 'dismissed') {
      target.resolvedAt = new Date().toISOString();
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_REPORTS, JSON.stringify(reports));
    }

    return target;
  },
};
