import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/Book';
import { SubmissionLog } from '../../models/submission-log.model';

@Component({
  selector: 'app-books-fields-component',
  imports: [
    RouterLink,
    NgForOf,
    NgIf,
    NgClass,
    DatePipe
  ],
  templateUrl: './books-fields-component.html',
  styleUrl: './books-fields-component.css'
})
export class BooksFieldsComponent implements OnInit {
  books: Book[] = [];
  username = '';
  roles: string[] = [];
  loading = false;
  selectedTimelineBookId: number | null = null;
  timeline: SubmissionLog[] = [];

  constructor(private router: Router, private bookService: BookService) {}

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

    this.loadBooks();
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

  loadBooks(): void {
    this.loading = true;
    this.bookService.getAll(this.username).pipe(
      catchError(() => {
        this.books = [];
        this.loading = false;
        return of([] as Book[]);
      })
    ).subscribe(data => {
      this.books = data ?? [];
      this.loading = false;
    });
  }

  addBook(): void {
    this.router.navigate(['book/details']);
  }

  viewBook(book: Book): void {
    this.router.navigate(['book/details'], { state: { book: { ...book }, reviewMode: true } });
  }

  editBook(book: Book): void {
    this.router.navigate(['book/details'], { state: { book: { ...book }, reviewMode: false } });
  }

  canSubmit(book: Book): boolean {
    const status = String(book?.status ?? '').toUpperCase();
    return status === 'SUBMITTED' || status === 'REJECTED_L1' || status === 'REJECTED_L2' || status === 'DRAFT';
  }

  canApprove(book: Book): boolean {
    const status = String(book?.status ?? '').toUpperCase();
    const canL1 = this.roles.includes('ADMIN') || this.roles.includes('REVIEWER_LEVEL_1');
    const canL2 = this.roles.includes('ADMIN') || this.roles.includes('REVIEWER_LEVEL_2');
    return (canL1 && (status === 'SUBMITTED' || status === 'UNDER_REVIEW_L1')) || (canL2 && status === 'UNDER_REVIEW_L2');
  }

  canReject(book: Book): boolean {
    return this.canApprove(book);
  }

  canAcceptByDhet(book: Book): boolean {
    const status = String(book?.status ?? '').toUpperCase();
    const canMark = this.roles.includes('ADMIN') || this.roles.includes('REVIEWER_LEVEL_2');
    return canMark && status === 'READY_FOR_POSTING';
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
      default:
        return normalized || '-';
    }
  }

  getStatusBadgeClass(status: unknown): string {
    const normalized = String(status ?? '').toUpperCase();
    switch (normalized) {
      case 'ACCEPTED_BY_DHET':
        return 'bg-success';
      case 'READY_FOR_POSTING':
      case 'UNDER_REVIEW_L2':
        return 'bg-info';
      case 'UNDER_REVIEW_L1':
      case 'SUBMITTED':
        return 'bg-warning';
      case 'REJECTED_L1':
      case 'REJECTED_L2':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  async submitForReview(book: Book): Promise<void> {
    if (!book?.id || !this.canSubmit(book)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Submit to Reviewer Level 1?',
      input: 'textarea',
      inputLabel: 'Comments (optional)',
      showCancelButton: true,
      confirmButtonText: 'Submit'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.bookService.submitForReview(Number(book.id), this.username, result.value ?? '').subscribe({
      next: (updated) => {
        book.status = updated.status;
        this.loadBooks();
        Swal.fire('Submitted', 'Book moved to Level 1 review.', 'success');
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not submit book for review.'), 'error')
    });
  }

  async approve(book: Book): Promise<void> {
    if (!book?.id || !this.canApprove(book)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Approve this book?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: value => !String(value ?? '').trim() ? 'Comments are required' : null,
      confirmButtonText: 'Approve'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.bookService.approve(Number(book.id), this.username, String(result.value).trim()).subscribe({
      next: (updated) => {
        book.status = updated.status;
        this.loadBooks();
        Swal.fire('Approved', 'Book status updated.', 'success');
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not approve book.'), 'error')
    });
  }

  async reject(book: Book): Promise<void> {
    if (!book?.id || !this.canReject(book)) {
      return;
    }

    const result = await Swal.fire({
      title: 'Reject this book?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: value => !String(value ?? '').trim() ? 'Comments are required' : null,
      confirmButtonText: 'Reject'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.bookService.reject(Number(book.id), this.username, String(result.value).trim()).subscribe({
      next: (updated) => {
        book.status = updated.status;
        this.loadBooks();
        Swal.fire('Rejected', 'Book status updated.', 'success');
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not reject book.'), 'error')
    });
  }

  async acceptByDhet(book: Book): Promise<void> {
    if (!book?.id || !this.canAcceptByDhet(book)) {
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

    this.bookService.acceptByDhet(Number(book.id), this.username, String(result.value).trim()).subscribe({
      next: (updated) => {
        book.status = updated.status;
        this.loadBooks();
        Swal.fire('Updated', 'Book marked as accepted by DHET.', 'success');
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not mark DHET acceptance.'), 'error')
    });
  }

  toggleTimeline(book: Book): void {
    if (!book?.id) {
      return;
    }

    if (this.selectedTimelineBookId === book.id) {
      this.selectedTimelineBookId = null;
      this.timeline = [];
      return;
    }

    this.bookService.getTimeline(Number(book.id)).subscribe({
      next: (timeline) => {
        this.selectedTimelineBookId = Number(book.id);
        this.timeline = timeline ?? [];
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not load timeline.'), 'error')
    });
  }
}
