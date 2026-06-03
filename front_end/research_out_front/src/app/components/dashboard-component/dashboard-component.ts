import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JournalService } from '../../services/journal-service';
import { Journal } from '../../models/journal.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard-component',
  imports: [CommonModule],
  templateUrl: './dashboard-component.html',
  standalone: true,
  styleUrl: './dashboard-component.css'
})
export class DashboardComponent implements OnInit {
  private readonly adminStaffNo = '16211';

  username = '';
  roles: string[] = [];
  loading = false;
  recentSubmissions: Array<{ title: string; type: string; status: string; units: number }> = [];
  activityLogs: Array<{ message: string; time: string }> = [];

  stats = {
    journals: 0,
    books: 0,
    conferences: 0,
    chapters: 0,
    totalUnits: 0,
    totalSubmissions: 0,
    totalOutputs: 0,
    activeResearchers: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    dhetCompliance: 0
  };

  constructor(private journalService: JournalService) {}

  ngOnInit(): void {
    this.resolveUserContext();
    this.loadDashboard();
  }

  private resolveUserContext(): void {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      return;
    }

    try {
      const login = JSON.parse(loginRaw);
      this.username = String(login?.user?.username ?? login?.username ?? '').trim();
      this.roles = this.extractRoles(login);
    } catch {
      this.username = '';
      this.roles = [];
    }
  }

  private extractRoles(login: any): string[] {
    const normalizedRoles = new Set<string>();
    const roleSource = login?.user?.roles ?? login?.user?.userType ?? login?.userType ?? '';

    if (Array.isArray(roleSource)) {
      roleSource
        .map((value: any) => String(value).toUpperCase().trim())
        .filter(Boolean)
        .forEach((role: string) => normalizedRoles.add(role));
    } else {
      String(roleSource)
        .split(',')
        .map(value => value.trim().toUpperCase())
        .filter(Boolean)
        .forEach(role => normalizedRoles.add(role));
    }

    const staffNo = String(login?.staff?.personNumber ?? '').trim();
    if (this.username === this.adminStaffNo || staffNo === this.adminStaffNo) {
      normalizedRoles.add('ADMIN');
    }

    return Array.from(normalizedRoles);
  }

  private loadDashboard(): void {
    this.loading = true;

    const isAdmin = this.roles.includes('ADMIN');
    const isReviewer = this.roles.includes('REVIEWER_LEVEL_1') || this.roles.includes('REVIEWER_LEVEL_2');

    // OPTIMIZATION: Use single dashboard stats endpoint instead of loading all journals
    // This reduces N+1 query problems and offloads calculation to the server
    const role = isAdmin ? 'admin' : isReviewer ? 'reviewer' : 'requestor';

    this.journalService.getDashboardStats(this.username, role).pipe(
      catchError(() => {
        // Fallback: load journals the old way
        const source$ = isAdmin
          ? this.journalService.getAllJournals()
          : isReviewer
            ? this.journalService.getReviewQueue(this.username, this.roles)
            : this.journalService.getAllJournals(this.username);
        return source$;
      })
    ).subscribe((statsOrJournals) => {
      if (statsOrJournals && 'totalJournals' in statsOrJournals) {
        // New format: pre-computed stats from dashboard endpoint
        this.populateStatsFromDashboardData(statsOrJournals, isAdmin ? 'admin' : isReviewer ? 'reviewer' : 'requestor');
      } else {
        // Fallback: old format with journals array
        const data = statsOrJournals ?? [];
        this.populateStats(data);
        this.populateRecentSubmissions(data);
        this.populateActivityLogs(data, isAdmin ? 'admin' : isReviewer ? 'reviewer' : 'requestor');
      }
      this.loading = false;
    });
  }

  private populateStatsFromDashboardData(dashboardData: any, mode: 'requestor' | 'reviewer' | 'admin'): void {
    // Use pre-computed stats from the server
    this.stats = {
      journals: dashboardData.totalJournals || 0,
      books: dashboardData.totalBooks || 0,
      conferences: dashboardData.totalConferences || 0,
      chapters: dashboardData.totalChapters || 0,
      totalUnits: dashboardData.totalUnits || 0,
      totalSubmissions: dashboardData.totalSubmissions || 0,
      totalOutputs: dashboardData.totalOutputs || 0,
      activeResearchers: dashboardData.activeResearchers || 0,
      approved: dashboardData.approvedCount || 0,
      pending: dashboardData.pendingCount || 0,
      rejected: dashboardData.rejectedCount || 0,
      dhetCompliance: dashboardData.dhetCompliancePercentage || 0
    };

    // Map recent submissions from dashboard data
    this.recentSubmissions = (dashboardData.recentSubmissions || []).map((rs: any) => ({
      title: rs.title ?? '-',
      type: rs.type || 'Journal',
      status: rs.status || 'PENDING',
      units: rs.units || 0
    }));

    // Populate activity logs
    const scopeText = mode === 'admin'
      ? 'System-wide'
      : mode === 'reviewer'
        ? 'Review queue'
        : 'My submissions';

    this.activityLogs = [
      { message: `${scopeText}: ${this.stats.journals} journal(s) loaded`, time: 'now' },
      { message: `Pending: ${this.stats.pending} | Approved: ${this.stats.approved} | Rejected: ${this.stats.rejected}`, time: 'now' },
      { message: `DHET compliance: ${this.stats.dhetCompliance}%`, time: 'now' }
    ];
  }

  private populateStats(journals: Journal[]): void {
    const total = journals.length;
    const approvedStatuses = new Set(['READY_FOR_POSTING', 'APPROVED']);
    const pendingStatuses = new Set(['SUBMITTED', 'UNDER_REVIEW_L1', 'UNDER_REVIEW_L2', 'UNDER_REVIEW', 'REVISION_REQUIRED']);
    const rejectedStatuses = new Set(['REJECTED_L1', 'REJECTED_L2', 'REJECTED']);

    const approved = journals.filter(j => approvedStatuses.has(String(j.status ?? '').toUpperCase())).length;
    const pending = journals.filter(j => pendingStatuses.has(String(j.status ?? '').toUpperCase())).length;
    const rejected = journals.filter(j => rejectedStatuses.has(String(j.status ?? '').toUpperCase())).length;

    const totalUnits = journals.reduce((sum, j) => sum + Number(j.units?.totalUnitsClaimed ?? 0), 0);
    const dhetCompliant = journals.filter(j => j.comply === true).length;
    const dhetCompliance = total > 0 ? Math.round((dhetCompliant / total) * 100) : 0;

    const uniqueResearchers = new Set(
      journals
        .map(j => String(j.submittedBy?.username ?? '').trim())
        .filter(Boolean)
    ).size;

    this.stats = {
      journals: total,
      books: 0,
      conferences: 0,
      chapters: 0,
      totalUnits: Number(totalUnits.toFixed(2)),
      totalSubmissions: total,
      totalOutputs: total,
      activeResearchers: uniqueResearchers,
      approved,
      pending,
      rejected,
      dhetCompliance
    };
  }

  private populateRecentSubmissions(journals: Journal[]): void {
    this.recentSubmissions = [...journals]
      .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
      .slice(0, 8)
      .map(j => ({
        title: j.title ?? '-',
        type: 'Journal',
        status: this.toDashboardStatus(j.status),
        units: Number(j.units?.totalUnitsClaimed ?? 0)
      }));
  }

  private populateActivityLogs(journals: Journal[], mode: 'requestor' | 'reviewer' | 'admin'): void {
    const approved = journals.filter(j => this.toDashboardStatus(j.status) === 'APPROVED').length;
    const pending = journals.filter(j => this.toDashboardStatus(j.status) === 'PENDING').length;
    const rejected = journals.filter(j => this.toDashboardStatus(j.status) === 'REJECTED').length;

    const scopeText = mode === 'admin'
      ? 'System-wide'
      : mode === 'reviewer'
        ? 'Review queue'
        : 'My submissions';

    this.activityLogs = [
      { message: `${scopeText}: ${journals.length} journal(s) loaded`, time: 'now' },
      { message: `Pending: ${pending} | Approved: ${approved} | Rejected: ${rejected}`, time: 'now' },
      { message: `DHET compliance: ${this.stats.dhetCompliance}%`, time: 'now' }
    ];
  }

  private toDashboardStatus(status?: string): 'APPROVED' | 'PENDING' | 'REJECTED' {
    const value = String(status ?? '').toUpperCase();
    if (value === 'READY_FOR_POSTING' || value === 'APPROVED') {
      return 'APPROVED';
    }
    if (value === 'REJECTED' || value === 'REJECTED_L1' || value === 'REJECTED_L2') {
      return 'REJECTED';
    }
    return 'PENDING';
  }
}
