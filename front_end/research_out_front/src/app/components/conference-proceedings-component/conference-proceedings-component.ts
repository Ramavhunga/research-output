import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { ConferenceProceedingsService } from '../../services/conference-proceedings.service';
import { ConferenceProceedings } from '../../models/ConfrenceProceedings';
import { SubmissionLog } from '../../models/submission-log.model';


@Component({
  selector: 'app-conference-proceedings-component',
  imports: [NgForOf, NgIf, NgClass, DatePipe, RouterLink],
  templateUrl: './conference-proceedings-component.html',
  styleUrl: './conference-proceedings-component.css'
})
export class ConferenceProceedingsComponent implements OnInit {
  proceedings: ConferenceProceedings[] = [];
  username = '';
  roles: string[] = [];
  loading = false;
  selectedTimelineProceedingId: number | null = null;
  timeline: SubmissionLog[] = [];

  constructor(
    private router: Router,
    private conferenceProceedingsService: ConferenceProceedingsService
  ) {}

  ngOnInit(): void {
    const login = sessionStorage.getItem('login');
    if (!login) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const data = JSON.parse(login);
      this.username = (data?.user?.username ?? data?.username ?? '').toString().trim();
      const roleSource = data?.user?.roles ?? data?.user?.userType ?? data?.userType ?? '';
      if (Array.isArray(roleSource)) {
        this.roles = roleSource.map((role: string) => String(role).toUpperCase().trim()).filter(Boolean);
      } else {
        this.roles = String(roleSource).split(',').map(role => role.trim().toUpperCase()).filter(Boolean);
      }
    } catch {
      this.username = '';
      this.roles = [];
    }

    this.loadProceedings();
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

  loadProceedings(): void {
    this.loading = true;
    this.conferenceProceedingsService.getAll(this.username).pipe(
      catchError(() => {
        this.proceedings = [];
        this.loading = false;
        return of([] as ConferenceProceedings[]);
      })
    ).subscribe(data => {
      this.proceedings = data ?? [];
      this.loading = false;
    });
  }

  addProceeding(): void {
    this.router.navigate(['proceeding/conferenceproceedingsdetails']);
  }

  viewProceeding(proceeding: ConferenceProceedings): void {
    if (!proceeding?.id) {
      return;
    }

    this.conferenceProceedingsService.getById(Number(proceeding.id)).subscribe({
      next: (fullProceeding) => {
        this.router.navigate(['proceeding/conferenceproceedingsdetails'], {
          state: { proceedings: { ...fullProceeding }, reviewMode: true }
        });
      },
      error: (err) => {
        Swal.fire('Error', this.getBackendMessage(err, 'Could not load proceeding details.'), 'error');
      }
    });
  }

  editProceeding(proceeding: ConferenceProceedings): void {
    if (!proceeding?.id) {
      return;
    }

    this.conferenceProceedingsService.getById(Number(proceeding.id)).subscribe({
      next: (fullProceeding) => {
        this.router.navigate(['proceeding/conferenceproceedingsdetails'], {
          state: { proceedings: { ...fullProceeding }, reviewMode: false }
        });
      },
      error: (err) => {
        Swal.fire('Error', this.getBackendMessage(err, 'Could not load proceeding details.'), 'error');
      }
    });
  }

  canSubmit(proceeding: ConferenceProceedings): boolean {
    const status = String((proceeding as any)?.status ?? '').toUpperCase();
    return status === 'SUBMITTED' || status === 'REJECTED_L1' || status === 'REJECTED_L2' || status === 'DRAFT';
  }

  getStatusLabel(status: unknown): string {
    const normalized = String(status ?? '').toUpperCase();
    switch (normalized) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Submitted';
      case 'UNDER_REVIEW_L1':
        return 'Under Review 1';
      case 'UNDER_REVIEW_L2':
        return 'Under Review 2';
      case 'READY_FOR_POSTING':
        return 'Ready for Posting';
      case 'ACCEPTED_BY_DHET':
        return 'Accepted by DHET';
      case 'REJECTED_L1':
        return 'Rejected (L1)';
      case 'REJECTED_L2':
        return 'Rejected (L2)';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return normalized || '-';
    }
  }

  getStatusBadgeClass(status: unknown): string {
    const normalized = String(status ?? '').toUpperCase();
    switch (normalized) {
      case 'POSTED_TO_DHET':
      case 'ACCEPTED_BY_DHET':
      case 'APPROVED':
        return 'bg-success';
      case 'READY_FOR_POSTING':
      case 'UNDER_REVIEW_L2':
        return 'bg-info';
      case 'UNDER_REVIEW_L1':
      case 'SUBMITTED':
        return 'bg-warning';
      case 'REJECTED':
      case 'REJECTED_L1':
      case 'REJECTED_L2':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  async submitForReview(proceeding: ConferenceProceedings): Promise<void> {
    if (!proceeding?.id || !this.canSubmit(proceeding)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Submit to Reviewer Level 1?',
      input: 'textarea',
      inputLabel: 'Comments (optional)',
      inputPlaceholder: 'Any context for reviewers...',
      showCancelButton: true,
      confirmButtonText: 'Submit'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.conferenceProceedingsService.submitForReview(Number(proceeding.id), this.username, result.value ?? '').subscribe({
      next: (updated) => {
        (proceeding as any).status = (updated as any).status;
        this.loadProceedings();
        Swal.fire('Submitted', 'Proceedings moved to Level 1 review.', 'success');
      },
      error: (err) => {
        console.error('Submit for review failed', err);
        Swal.fire('Error', this.getBackendMessage(err, 'Could not submit proceedings for review.'), 'error');
      }
    });
  }

  canApprove(proceeding: ConferenceProceedings): boolean {
    const status = String((proceeding as any)?.status ?? '').toUpperCase();
    const canL1 = this.roles.includes('ADMIN') || this.roles.includes('REVIEWER_LEVEL_1');
    const canL2 = this.roles.includes('ADMIN') || this.roles.includes('REVIEWER_LEVEL_2');
    return (canL1 && (status === 'SUBMITTED' || status === 'UNDER_REVIEW_L1')) || (canL2 && status === 'UNDER_REVIEW_L2');
  }

  canReject(proceeding: ConferenceProceedings): boolean {
    return this.canApprove(proceeding);
  }

  canAcceptByDhet(proceeding: ConferenceProceedings): boolean {
    const status = String((proceeding as any)?.status ?? '').toUpperCase();
    const canMark = this.roles.includes('ADMIN') || this.roles.includes('REVIEWER_LEVEL_2');
    return canMark && status === 'READY_FOR_POSTING';
  }

  async approve(proceeding: ConferenceProceedings): Promise<void> {
    if (!proceeding?.id || !this.canApprove(proceeding)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Approve this proceeding?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: value => !String(value ?? '').trim() ? 'Comments are required' : null,
      confirmButtonText: 'Approve'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.conferenceProceedingsService.approve(Number(proceeding.id), this.username, String(result.value).trim()).subscribe({
      next: (updated) => {
        (proceeding as any).status = (updated as any).status;
        this.loadProceedings();
        Swal.fire('Approved', 'Proceedings status updated.', 'success');
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not approve proceedings.'), 'error')
    });
  }

  async reject(proceeding: ConferenceProceedings): Promise<void> {
    if (!proceeding?.id || !this.canReject(proceeding)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Reject this proceeding?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: value => !String(value ?? '').trim() ? 'Comments are required' : null,
      confirmButtonText: 'Reject'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.conferenceProceedingsService.reject(Number(proceeding.id), this.username, String(result.value).trim()).subscribe({
      next: (updated) => {
        (proceeding as any).status = (updated as any).status;
        this.loadProceedings();
        Swal.fire('Rejected', 'Proceedings status updated.', 'success');
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not reject proceedings.'), 'error')
    });
  }

  async acceptByDhet(proceeding: ConferenceProceedings): Promise<void> {
    if (!proceeding?.id || !this.canAcceptByDhet(proceeding)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Mark as Accepted by DHET?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: value => !String(value ?? '').trim() ? 'Comments are required' : null,
      confirmButtonText: 'Mark Accepted'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.conferenceProceedingsService.acceptByDhet(Number(proceeding.id), this.username, String(result.value).trim()).subscribe({
      next: (updated) => {
        (proceeding as any).status = (updated as any).status;
        this.loadProceedings();
        Swal.fire('Updated', 'Proceedings marked as accepted by DHET.', 'success');
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not mark DHET acceptance.'), 'error')
    });
  }

  toggleTimeline(proceeding: ConferenceProceedings): void {
    if (!proceeding?.id) {
      return;
    }

    if (this.selectedTimelineProceedingId === proceeding.id) {
      this.selectedTimelineProceedingId = null;
      this.timeline = [];
      return;
    }

    this.conferenceProceedingsService.getTimeline(Number(proceeding.id)).subscribe({
      next: (timeline) => {
        this.selectedTimelineProceedingId = Number(proceeding.id);
        this.timeline = timeline ?? [];
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not load timeline.'), 'error')
    });
  }
}
