import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Journal } from '../../models/journal.model';
import { JournalApproval } from '../../models/journal-approval.model';
import { JournalService } from '../../services/journal-service';
import { JournalPermissionService } from '../../services/journal-permission.service';

@Component({
  selector: 'app-journal-review-component',
  imports: [CommonModule, RouterLink],
  templateUrl: './journal-review-component.html',
  styleUrl: './journal-review-component.css'
})
export class JournalReviewComponent implements OnInit {
  private readonly adminStaffNo = '16211';

  journals: Journal[] = [];
  timeline: JournalApproval[] = [];
  selectedTimelineJournalId: number | null = null;
  loading = false;
  username = '';
  roles: string[] = [];

  constructor(
    private journalService: JournalService,
    private router: Router,
    private permissionService: JournalPermissionService
  ) {}

  ngOnInit(): void {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const login = JSON.parse(loginRaw);
      this.username = (login?.user?.username ?? login?.username ?? '').toString().trim();
      this.roles = this.extractRoles(login);
    } catch {
      this.username = '';
      this.roles = [];
    }

    this.loadReviewQueue();
  }

  private extractRoles(login: any): string[] {
    const normalizedRoles = new Set<string>();
    const roleSource = login?.user?.roles ?? login?.user?.userType ?? login?.userType ?? '';

    if (Array.isArray(roleSource)) {
      roleSource
        .map(value => String(value).toUpperCase().trim())
        .filter(Boolean)
        .forEach(role => normalizedRoles.add(role));
    } else {
      String(roleSource)
        .split(',')
        .map(value => value.trim().toUpperCase())
        .filter(Boolean)
        .forEach(role => normalizedRoles.add(role));
    }

    const username = String(login?.user?.username ?? login?.username ?? '').trim();
    const staffNo = String(login?.staff?.personNumber ?? '').trim();
    if (username === this.adminStaffNo || staffNo === this.adminStaffNo) {
      normalizedRoles.add('ADMIN');
    }

    return Array.from(normalizedRoles);
  }

  hasReviewRole(): boolean {
    return this.roles.includes('ADMIN') || this.roles.includes('REVIEWER_LEVEL_1') || this.roles.includes('REVIEWER_LEVEL_2');
  }

  loadReviewQueue(): void {
    this.loading = true;
    this.journalService.getReviewQueue(this.username, this.roles).subscribe({
      next: (journals) => {
        this.journals = journals ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load review queue', err);
        Swal.fire('Error', 'Could not load journals for review.', 'error');
      }
    });
  }

  private getBackendMessage(err: any, fallback: string): string {
    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }
    return fallback;
  }

  canApprove(journal: Journal): boolean {
    const status = (journal.status ?? '').toUpperCase();
    if (status === 'SUBMITTED' || status === 'UNDER_REVIEW_L1') {
      return this.roles.includes('REVIEWER_LEVEL_1') || this.roles.includes('ADMIN');
    }
    if (status === 'UNDER_REVIEW_L2') {
      return this.roles.includes('REVIEWER_LEVEL_2') || this.roles.includes('ADMIN');
    }
    return false;
  }

  canEditJournal(journal: Journal): boolean {
    return this.permissionService.canEditJournal(journal).canEdit;
  }

  editJournal(journal: Journal): void {
    const permission = this.permissionService.canEditJournal(journal);
    if (!permission.canEdit) {
      Swal.fire('Cannot Edit', permission.reason, 'warning');
      return;
    }

    this.router.navigate(['journal/details'], { state: { journal, reviewMode: false } });
  }

  viewJournal(journal: Journal): void {
    this.router.navigate(['journal/details'], { state: { journal, reviewMode: true } });
  }

  async approve(journal: Journal): Promise<void> {
    if (!journal.id || !this.canApprove(journal)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Approve journal?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      inputPlaceholder: 'Provide approval comments...',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      preConfirm: (value) => {
        if (!value || !String(value).trim()) {
          Swal.showValidationMessage('Approval comments are required.');
          return false;
        }
        return value;
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    this.journalService.approve(journal.id, this.username, String(result.value)).subscribe({
      next: () => {
        Swal.fire('Approved', 'Journal moved to the next stage.', 'success');
        this.loadReviewQueue();
      },
      error: (err) => {
        console.error('Approve failed', err);
        Swal.fire('Error', this.getBackendMessage(err, 'Approval failed.'), 'error');
      }
    });
  }

  async reject(journal: Journal): Promise<void> {
    if (!journal.id || !this.canApprove(journal)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Reject journal?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      inputPlaceholder: 'Provide rejection reason...',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      preConfirm: (value) => {
        if (!value || !String(value).trim()) {
          Swal.showValidationMessage('Rejection comments are required.');
          return false;
        }
        return value;
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    this.journalService.reject(journal.id, this.username, String(result.value)).subscribe({
      next: () => {
        Swal.fire('Rejected', 'Journal sent back to requestor.', 'success');
        this.loadReviewQueue();
      },
      error: (err) => {
        console.error('Reject failed', err);
        Swal.fire('Error', this.getBackendMessage(err, 'Rejection failed.'), 'error');
      }
    });
  }

  toggleTimeline(journal: Journal): void {
    if (!journal.id) {
      return;
    }

    if (this.selectedTimelineJournalId === journal.id) {
      this.selectedTimelineJournalId = null;
      this.timeline = [];
      return;
    }

    this.journalService.getTimeline(journal.id).subscribe({
      next: (timeline) => {
        this.selectedTimelineJournalId = journal.id ?? null;
        this.timeline = timeline ?? [];
      },
      error: (err) => {
        console.error('Timeline load failed', err);
        Swal.fire('Error', 'Could not load timeline.', 'error');
      }
    });
  }
}
