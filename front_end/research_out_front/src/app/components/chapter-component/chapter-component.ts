import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { ChapterService } from '../../services/chapter.service';
import { Chapter } from '../../models/Chapter';
import { SubmissionLog } from '../../models/submission-log.model';

@Component({
  selector: 'app-chapter-component',
  imports: [NgForOf, NgIf, NgClass, DatePipe],
  templateUrl: './chapter-component.html',
  styleUrl: './chapter-component.css'
})
export class ChapterComponent implements OnInit {
  chapters: Chapter[] = [];
  username = '';
  loading = false;
  selectedTimelineChapterId: number | null = null;
  timeline: SubmissionLog[] = [];

  constructor(private router: Router, private chapterService: ChapterService) {}

  ngOnInit(): void {
    const login = sessionStorage.getItem('login');
    if (!login) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const data = JSON.parse(login);
      this.username = (data?.user?.username ?? data?.username ?? '').toString().trim();
    } catch {
      this.username = '';
    }

    this.loadChapters();
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

  loadChapters(): void {
    this.loading = true;
    this.chapterService.getAll(this.username).pipe(
      catchError(() => {
        this.chapters = [];
        this.loading = false;
        return of([] as Chapter[]);
      })
    ).subscribe(data => {
      this.chapters = data ?? [];
      this.loading = false;
    });
  }

  goToChapterDetails(): void {
    this.router.navigate(['chapter/chapterdetails']);
  }

  viewChapter(chapter: Chapter): void {
    this.router.navigate(['chapter/chapterdetails'], { state: { chapter, reviewMode: true } });
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

  toggleTimeline(chapter: Chapter): void {
    if (!chapter?.id) {
      return;
    }

    if (this.selectedTimelineChapterId === chapter.id) {
      this.selectedTimelineChapterId = null;
      this.timeline = [];
      return;
    }

    this.chapterService.getTimeline(Number(chapter.id)).subscribe({
      next: (timeline) => {
        this.selectedTimelineChapterId = Number(chapter.id);
        this.timeline = timeline ?? [];
      },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Could not load timeline.'), 'error')
    });
  }
}
