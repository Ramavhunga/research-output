import { Component } from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {catchError, of} from 'rxjs';
import {JournalService} from '../../services/journal-service';
import {Journal} from '../../models/journal.model';
import {JournalApproval} from '../../models/journal-approval.model';
import {JournalPermissionService} from '../../services/journal-permission.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-journal-component',
  imports: [
    NgForOf,
    NgIf,
    DatePipe,
    RouterLink
  ],
  templateUrl: './journal-component.html',
  styleUrl: './journal-component.css'
})
export class JournalComponent {
  private readonly adminStaffNo = '16211';

  journals: Journal[] = [];
  username = '';
  roles: string[] = [];
  loading = false;
  selectedTimelineJournalId: number | null = null;
  timeline: JournalApproval[] = [];

  constructor(
    private service: JournalService,
    private router: Router,
    private permissionService: JournalPermissionService
  ) {}

  ngOnInit(): void {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      this.router.navigate(['/login']);
      return;
    }

    let username = '';
    let loginData: any = null;
    try {
      loginData = JSON.parse(loginRaw);
      const data = loginData;
      username = (data?.user?.username ?? data?.username ?? '').toString().trim();
    } catch {
      username = '';
      loginData = null;
    }

    this.username = username;
    this.roles = this.extractRoles(loginData);

    this.loadJournals();
  }

  isAdmin(): boolean {
    return this.roles.includes('ADMIN');
  }

  private extractRoles(login: any): string[] {
    if (!login) {
      return [];
    }

    const normalizedRoles = new Set<string>();
    const roleSource = login?.user?.roles ?? login?.user?.userType ?? login?.userType ?? '';

    if (Array.isArray(roleSource)) {
      roleSource
        .map((value: unknown) => String(value).toUpperCase().trim())
        .filter(Boolean)
        .forEach((role: string) => normalizedRoles.add(role));
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

  // Keep list payload light; detail view fetches full record (including attachments) by id.
  private stripAttachments(journal: Journal): Journal {
    return { ...journal, attachments: undefined };
  }

  loadJournals(): void {
    this.loading = true;
    this.service.getAllJournals(this.username).pipe(
      // Keep journal page responsive even if API fails.
      catchError(() => {
        this.journals = [];
        this.loading = false;
        return of([] as Journal[]);
      })
    ).subscribe(data => {
      this.journals = (data ?? []).map(journal => this.stripAttachments(journal));
      this.loading = false;
    });
  }



  viewJournal(journal: Journal) {
    this.router.navigate(['journal/details'], { state: { journal: this.stripAttachments(journal), reviewMode: true } });
  }

  canEditJournal(journal: Journal): boolean {
    const permission = this.permissionService.canEditJournal(journal);
    return permission.canEdit;
  }

  editJournal(journal: Journal): void {
    const permission = this.permissionService.canEditJournal(journal);

    if (!permission.canEdit) {
      Swal.fire({
        title: 'Cannot Edit',
        text: permission.reason,
        icon: 'warning'
      });
      return;
    }

    this.router.navigate(['journal/details'], { state: { journal: this.stripAttachments(journal), reviewMode: false } });
  }

  canSubmit(journal: Journal): boolean {
    const status = (journal.status ?? '').toUpperCase();
    return status === 'SUBMITTED' || status === 'REJECTED_L1' || status === 'REJECTED_L2' || status === 'DRAFT';
  }

  async submitForReview(journal: Journal): Promise<void> {
    if (!journal.id || !this.canSubmit(journal)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Submit to Reviewer Level 1?',
      input: 'textarea',
      inputLabel: 'Comments (optional)',
      inputPlaceholder: 'Any context for reviewers... ',
      showCancelButton: true,
      confirmButtonText: 'Submit'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.service.submitForReview(journal.id, this.username, result.value ?? '').subscribe({
      next: (updated) => {
        journal.status = updated.status;
        this.loadJournals();
        Swal.fire('Submitted', 'Journal moved to Level 1 review.', 'success');
      },
      error: (err) => {
        console.error('Submit for review failed', err);
        Swal.fire('Error', this.getBackendMessage(err, 'Could not submit journal for review.'), 'error');
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

    this.service.getTimeline(journal.id).subscribe({

      next: (timeline) => {
        debugger;
        this.selectedTimelineJournalId = journal.id ?? null;
        this.timeline = timeline ?? [];
      },
      error: (err) => {
        debugger;
        console.error('Timeline load failed', err);
        Swal.fire('Error', this.getBackendMessage(err, 'Could not load timeline.'), 'error');
      }
    });
  }
}
