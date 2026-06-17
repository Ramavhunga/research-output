import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {NgForOf, NgIf} from '@angular/common';
import {catchError, of} from 'rxjs';
import {ChapterService} from '../../services/chapter.service';
import {Chapter} from '../../models/Chapter';

@Component({
  selector: 'app-chapter-component',
    imports: [
        NgForOf,
        NgIf
    ],
  templateUrl: './chapter-component.html',
  styleUrl: './chapter-component.css'
})
export class ChapterComponent {
  chapters: Chapter[] = [];
  username = '';
  loading = false;

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

  goToChapterDetails() {
    this.router.navigate(['chapter/chapterdetails']);
  }

  viewChapter(chapter: Chapter): void {
    this.router.navigate(['chapter/chapterdetails'], { state: { chapter, reviewMode: true } });
  }

  chapterStatus(chapter: Chapter): string {
    return (chapter as unknown as { status?: string }).status ?? 'SUBMITTED';
  }
}
