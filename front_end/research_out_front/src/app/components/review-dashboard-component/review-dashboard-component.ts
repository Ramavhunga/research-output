import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { JournalService } from '../../services/journal-service';
import { BookService } from '../../services/book.service';
import { ChapterService } from '../../services/chapter.service';
import { ConferenceProceedingsService } from '../../services/conference-proceedings.service';
import { Journal } from '../../models/journal.model';
import { Book } from '../../models/Book';
import { Chapter } from '../../models/Chapter';
import { ConferenceProceedings } from '../../models/ConfrenceProceedings';

type ReviewTab = 'journals' | 'books' | 'chapters' | 'proceedings';

interface ReviewRow {
  id: number;
  entity: ReviewTab;
  dhetNo: string;
  title: string;
  requestor: string;
  status: string;
  raw: any;
}

type ExcelCellValue = string | number | boolean | null | undefined;

@Component({
  selector: 'app-review-dashboard-component',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './review-dashboard-component.html',
  styleUrl: './review-dashboard-component.css'
})
export class ReviewDashboardComponent implements OnInit {
  activeTab: ReviewTab = 'journals';
  loading = false;
  username = '';
  roles: string[] = [];
  searchTerm = '';
  selectedStatus = 'ALL';
  rows: ReviewRow[] = [];
  filtered: ReviewRow[] = [];
  currentPage = 1;
  pageSize = 8;
  readonly pageSizeOptions = [6, 8, 10, 12];
  readonly statusOptions = ['ALL', 'SUBMITTED', 'UNDER_REVIEW_L1', 'UNDER_REVIEW_L2', 'REJECTED_L1', 'REJECTED_L2', 'READY_FOR_POSTING'];

  constructor(
    private router: Router,
    private journalService: JournalService,
    private bookService: BookService,
    private chapterService: ChapterService,
    private proceedingsService: ConferenceProceedingsService
  ) {}

  ngOnInit(): void {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const login = JSON.parse(loginRaw);
      this.username = String(login?.user?.username ?? login?.username ?? '').trim();
      const roleSource = login?.user?.roles ?? login?.user?.userType ?? login?.userType ?? '';
      if (Array.isArray(roleSource)) {
        this.roles = roleSource.map((r: string) => String(r).toUpperCase().trim()).filter(Boolean);
      } else {
        this.roles = String(roleSource).split(',').map((r) => r.trim().toUpperCase()).filter(Boolean);
      }
    } catch {
      this.username = '';
      this.roles = [];
    }

    this.loadTabData();
  }

  setActiveTab(tab: ReviewTab): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.loadTabData();
  }

  isActive(tab: ReviewTab): boolean {
    return this.activeTab === tab;
  }

  private normalizeStatus(status: unknown): string {
    return String(status ?? '').toUpperCase().trim();
  }

  private isAdmin(): boolean {
    return this.roles.includes('ADMIN') || this.roles.includes('ADMINISTRATOR');
  }

  private isReviewStatus(status: string): boolean {
    return ['SUBMITTED', 'UNDER_REVIEW_L1', 'UNDER_REVIEW_L2', 'REJECTED_L1', 'REJECTED_L2', 'READY_FOR_POSTING'].includes(status);
  }

  private mapJournal(item: Journal): ReviewRow {
    return {
      id: Number(item.id),
      entity: 'journals',
      dhetNo: String(item.dhetNo ?? ''),
      title: String(item.title ?? ''),
      requestor: String(item.submittedBy?.username ?? '-'),
      status: this.normalizeStatus(item.status),
      raw: item
    };
  }

  private mapBook(item: Book): ReviewRow {
    return {
      id: Number(item.id),
      entity: 'books',
      dhetNo: String(item.dhetNo ?? ''),
      title: String(item.titleOfBook ?? ''),
      requestor: String(item.submittedBy?.username ?? '-'),
      status: this.normalizeStatus(item.status),
      raw: item
    };
  }

  private mapChapter(item: Chapter): ReviewRow {
    return {
      id: Number(item.id),
      entity: 'chapters',
      dhetNo: String(item.dhetNo ?? ''),
      title: String(item.titleOfContribution ?? item.titleOfBook ?? ''),
      requestor: String(item.submittedBy?.username ?? '-'),
      status: this.normalizeStatus(item.status),
      raw: item
    };
  }

  private mapProceedings(item: ConferenceProceedings): ReviewRow {
    return {
      id: Number(item.id),
      entity: 'proceedings',
      dhetNo: String(item.dhetNo ?? ''),
      title: String(item.titleOfContribution ?? ''),
      requestor: String(item.submittedBy?.username ?? '-'),
      status: this.normalizeStatus(item.status),
      raw: item
    };
  }

  loadTabData(): void {
    this.loading = true;

    if (this.activeTab === 'journals') {
      this.journalService.getAllJournalsForReview().subscribe({
        next: (items) => {
          this.rows = (items ?? []).map((i) => this.mapJournal(i)).filter((i) => this.isReviewStatus(i.status));
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.rows = [];
          this.filtered = [];
          this.loading = false;
        }
      });
      return;
    }

    if (this.activeTab === 'books') {
      this.bookService.getAllForReview().subscribe({
        next: (items) => {
          this.rows = (items ?? []).map((i) => this.mapBook(i)).filter((i) => this.isReviewStatus(i.status));
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.rows = [];
          this.filtered = [];
          this.loading = false;
        }
      });
      return;
    }

    if (this.activeTab === 'chapters') {
      this.chapterService.getAllForReview().subscribe({
        next: (items) => {
          this.rows = (items ?? []).map((i) => this.mapChapter(i)).filter((i) => this.isReviewStatus(i.status));
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.rows = [];
          this.filtered = [];
          this.loading = false;
        }
      });
      return;
    }

    this.proceedingsService.getAllForReview().subscribe({
      next: (items) => {
        this.rows = (items ?? []).map((i) => this.mapProceedings(i)).filter((i) => this.isReviewStatus(i.status));
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const selected = this.selectedStatus.toUpperCase();

    this.filtered = this.rows.filter((row) => {
      const matchesStatus = selected === 'ALL' || row.status === selected;
      const haystack = `${row.dhetNo} ${row.title} ${row.requestor}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesStatus && matchesSearch;
    });

    this.currentPage = 1;
  }

  get pagedRows(): ReviewRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.filtered.length / this.pageSize), 1);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage -= 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage += 1;
  }

  canApprove(row: ReviewRow): boolean {
    const canL1 = this.roles.includes('REVIEWER_LEVEL_1');
    const canL2 = this.roles.includes('REVIEWER_LEVEL_2');
    if (this.isAdmin()) {
      return row.status === 'SUBMITTED' || row.status === 'UNDER_REVIEW_L1' || row.status === 'UNDER_REVIEW_L2';
    }
    return (canL1 && (row.status === 'SUBMITTED' || row.status === 'UNDER_REVIEW_L1')) || (canL2 && row.status === 'UNDER_REVIEW_L2');
  }

  canAcceptByDhet(row: ReviewRow): boolean {
    return (this.isAdmin() || this.roles.includes('REVIEWER_LEVEL_2')) && row.status === 'READY_FOR_POSTING';
  }

  canMoveStage(row: ReviewRow): boolean {
    return this.isAdmin() && this.getStageOptions(row.entity).length > 0;
  }

  private getStageOptions(entity: ReviewTab): string[] {
    if (entity === 'journals') {
      return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW_L1', 'UNDER_REVIEW_L2', 'REJECTED_L1', 'REJECTED_L2', 'READY_FOR_POSTING', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'];
    }
    if (entity === 'books' || entity === 'chapters') {
      return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW_L1', 'UNDER_REVIEW_L2', 'REJECTED_L1', 'REJECTED_L2', 'READY_FOR_POSTING', 'ACCEPTED_BY_DHET'];
    }
    return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW_L1', 'UNDER_REVIEW_L2', 'REJECTED_L1', 'REJECTED_L2', 'READY_FOR_POSTING', 'ACCEPTED_BY_DHET', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'];
  }

  private toStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  async moveStage(row: ReviewRow): Promise<void> {
    if (!this.canMoveStage(row)) return;

    const statusOptions = this.getStageOptions(row.entity);
    const inputOptions: Record<string, string> = {};
    statusOptions.forEach((status) => {
      inputOptions[status] = this.toStatusLabel(status);
    });

    const result = await Swal.fire({
      title: `Move ${row.entity.slice(0, -1)} stage`,
      input: 'select',
      inputOptions,
      inputValue: row.status,
      showCancelButton: true,
      confirmButtonText: 'Update Stage',
      inputValidator: (value) => !String(value ?? '').trim() ? 'Select a status' : null
    });

    if (!result.isConfirmed) return;
    const status = String(result.value ?? '').trim().toUpperCase();
    if (!status || status === row.status) return;

    if (row.entity === 'journals') {
      this.journalService.transitionStatus(row.id, status, this.username).subscribe({
        next: () => { Swal.fire('Updated', 'Stage updated.', 'success'); this.loadTabData(); },
        error: (err: any) => Swal.fire('Error', this.getBackendMessage(err, 'Stage update failed.'), 'error')
      });
      return;
    }
    if (row.entity === 'books') {
      this.bookService.transitionStatus(row.id, status, this.username).subscribe({
        next: () => { Swal.fire('Updated', 'Stage updated.', 'success'); this.loadTabData(); },
        error: (err: any) => Swal.fire('Error', this.getBackendMessage(err, 'Stage update failed.'), 'error')
      });
      return;
    }
    if (row.entity === 'chapters') {
      this.chapterService.transitionStatus(row.id, status, this.username).subscribe({
        next: () => { Swal.fire('Updated', 'Stage updated.', 'success'); this.loadTabData(); },
        error: (err: any) => Swal.fire('Error', this.getBackendMessage(err, 'Stage update failed.'), 'error')
      });
      return;
    }

    this.proceedingsService.transitionStatus(row.id, status, this.username).subscribe({
      next: () => { Swal.fire('Updated', 'Stage updated.', 'success'); this.loadTabData(); },
      error: (err: any) => Swal.fire('Error', this.getBackendMessage(err, 'Stage update failed.'), 'error')
    });
  }

  private isReviewerContext(): boolean {
    return this.roles.includes('ADMIN')
      || this.roles.includes('REVIEWER_LEVEL_1')
      || this.roles.includes('REVIEWER_LEVEL_2');
  }

  private navigateToDetail(row: ReviewRow, isEditAction: boolean): void {
    // Reviewer queue should provide the same capability from both View and Edit actions.
    const reviewMode = this.isReviewerContext() ? false : !isEditAction;

    if (row.entity === 'journals') {
      this.router.navigate(['journal/details'], { state: { journal: { ...row.raw }, reviewMode } });
      return;
    }
    if (row.entity === 'books') {
      this.router.navigate(['book/details'], { state: { book: { ...row.raw }, reviewMode } });
      return;
    }
    if (row.entity === 'chapters') {
      this.router.navigate(['chapter/chapterdetails'], { state: { chapter: { ...row.raw }, reviewMode } });
      return;
    }
    this.router.navigate(['proceeding/conferenceproceedingsdetails'], { state: { proceedings: { ...row.raw }, reviewMode } });
  }

  view(row: ReviewRow): void {
    this.navigateToDetail(row, false);
  }

  edit(row: ReviewRow): void {
    this.navigateToDetail(row, true);
  }

  open(row: ReviewRow): void {
    this.navigateToDetail(row, true);
  }

  exportCurrentTab(): void {
    if (this.activeTab === 'journals') {
      this.exportDhetJournalExcel();
      return;
    }

    if (this.activeTab === 'proceedings') {
      this.exportDhetProceedingsExcel();
      return;
    }

    if (this.activeTab === 'books') {
      this.exportDhetBooksExcel();
      return;
    }

    if (this.activeTab === 'chapters') {
      this.exportDhetChaptersExcel();
      return;
    }

    if (this.loading || this.filtered.length === 0) {
      Swal.fire('No Data', 'There is no data to export for the current tab/filter.', 'info');
      return;
    }

    const exportRows = this.filtered.map((row) => this.mapExportRow(row));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, this.getExportSheetName());

    const fileName = `review-${this.activeTab}-${this.getTimestampToken()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private exportDhetJournalExcel(): void {
    this.journalService.exportReadyForPostingJournals().subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          Swal.fire('No Data', 'No READY_FOR_POSTING journals are available for DHET export.', 'info');
          return;
        }

        const fileName = this.resolveFileNameFromResponse(response) || 'dhet-journals.xlsx';
        this.downloadBlob(blob, fileName);
      },
      error: (err) => {
        Swal.fire('Error', this.getBackendMessage(err, 'Could not export DHET journal report.'), 'error');
      }
    });
  }

  private exportDhetBooksExcel(): void {
    this.bookService.exportReadyForPostingBooks().subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          Swal.fire('No Data', 'No READY_FOR_POSTING books are available for DHET export.', 'info');
          return;
        }

        const fileName = this.resolveFileNameFromResponse(response) || 'dhet-books.xlsx';
        this.downloadBlob(blob, fileName);
      },
      error: (err) => {
        this.showExportError(err, 'Could not export DHET books report.');
      }
    });
  }

  private exportDhetProceedingsExcel(): void {
    this.proceedingsService.exportReadyForPostingProceedings().subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          Swal.fire('No Data', 'No READY_FOR_POSTING conference proceedings are available for DHET export.', 'info');
          return;
        }

        const fileName = this.resolveFileNameFromResponse(response) || 'dhet-conference-proceedings.xlsx';
        this.downloadBlob(blob, fileName);
      },
      error: (err) => {
        this.showExportError(err, 'Could not export DHET conference proceedings report.');
      }
    });
  }

  private exportDhetChaptersExcel(): void {
    this.chapterService.exportReadyForPostingChapters().subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          Swal.fire('No Data', 'No READY_FOR_POSTING chapters are available for DHET export.', 'info');
          return;
        }

        const fileName = this.resolveFileNameFromResponse(response) || 'dhet-chapters.xlsx';
        this.downloadBlob(blob, fileName);
      },
      error: (err) => {
        this.showExportError(err, 'Could not export DHET chapters report.');
      }
    });
  }

  private showExportError(err: any, fallback: string): void {
    const blobError = err?.error;
    if (blobError instanceof Blob) {
      blobError.text().then((text) => {
        const message = (text || '').trim() || fallback;
        Swal.fire('Error', message, 'error');
      }).catch(() => {
        Swal.fire('Error', this.getBackendMessage(err, fallback), 'error');
      });
      return;
    }
    Swal.fire('Error', this.getBackendMessage(err, fallback), 'error');
  }

  private resolveFileNameFromResponse(response: HttpResponse<Blob>): string | null {
    const disposition = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    if (!disposition) {
      return null;
    }

    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    const encodedName = match?.[1] ?? match?.[2];
    return encodedName ? decodeURIComponent(encodedName) : null;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }

  private getExportSheetName(): string {
    if (this.activeTab === 'journals') return 'Journals';
    if (this.activeTab === 'books') return 'Books';
    if (this.activeTab === 'chapters') return 'Chapters';
    return 'Proceedings';
  }

  private getTimestampToken(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}-${hh}${mi}`;
  }

  private normalizeExcelValue(value: unknown): ExcelCellValue {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value).trim();
  }

  private mapExportRow(row: ReviewRow): Record<string, ExcelCellValue> {
    if (row.entity === 'journals') {
      const item = row.raw as Journal;
      return {
        'DHET No.': row.dhetNo,
        'Year of Publication': this.normalizeExcelValue(item.year),
        'Journal Title': this.normalizeExcelValue(item.journalTitle),
        'Article Title': this.normalizeExcelValue(item.title),
        'Publisher': this.normalizeExcelValue(item.publisher),
        'ISSN': this.normalizeExcelValue(item.issn),
        'Field of Research': this.normalizeExcelValue(item.fieldofsearch),
        'Requestor': row.requestor,
        'Status': row.status
      };
    }

    if (row.entity === 'books') {
      const item = row.raw as Book;
      return {
        'DHET No.': row.dhetNo,
        'Original / Photocopy': this.normalizeExcelValue(item.originalOrPhotocopy),
        'Evidence of peer review (Y/N)': this.normalizeExcelValue(item.evidenceOfPeerReview),
        'Type of Evidence': this.normalizeExcelValue(item.typeOfEvidence),
        'Year of Publication': this.normalizeExcelValue(item.yearOfPublication),
        'Title of Book': this.normalizeExcelValue(item.titleOfBook),
        'Editor(s) if applicable': this.normalizeExcelValue(item.editors),
        'Publisher': this.normalizeExcelValue(item.publisher),
        'ISBN/ISSN': this.normalizeExcelValue(item.isbn),
        'Field of Research': this.normalizeExcelValue(item.fieldOfResearch),
        'Requestor': row.requestor,
        'Status': row.status
      };
    }

    if (row.entity === 'chapters') {
      const item = row.raw as Chapter;
      return {
        'DHET No.': row.dhetNo,
        'Original / Photocopy': this.normalizeExcelValue(item.originalOrPhotocopy),
        'Evidence of peer review (Y/N)': this.normalizeExcelValue(item.evidenceOfPeerReview),
        'Type of Evidence': this.normalizeExcelValue(item.typeOfEvidence),
        'Year of Publication': this.normalizeExcelValue(item.yearOfPublication),
        'Title of Book': this.normalizeExcelValue(item.titleOfBook),
        'Title of Contribution': this.normalizeExcelValue(item.titleOfContribution),
        'Editor(s) if applicable': this.normalizeExcelValue(item.editors),
        'Publisher': this.normalizeExcelValue(item.publisher),
        'ISBN/ISSN': this.normalizeExcelValue(item.isbn),
        'Field of Research': this.normalizeExcelValue(item.fieldOfResearch),
        'Requestor': row.requestor,
        'Status': row.status
      };
    }

    const item = row.raw as ConferenceProceedings;
    return {
      'DHET No.': row.dhetNo,
      'Original / Photocopy': this.normalizeExcelValue(item.originalOrPhotocopy),
      'Evidence of peer review (Y/N)': this.normalizeExcelValue(item.evidenceOfPeerReview),
      'Type of Evidence': this.normalizeExcelValue(item.typeOfEvidence),
      'Year of Publication': this.normalizeExcelValue(item.yearOfPublication),
      'Title of Proceeding': this.normalizeExcelValue(item.titleOfProceeding),
      'Title of Contribution': this.normalizeExcelValue(item.titleOfContribution),
      'Complies with 60% rule?': this.normalizeExcelValue(item.compliesWith60Rule),
      'Editor(s) if applicable': this.normalizeExcelValue(item.editors),
      'Publisher': this.normalizeExcelValue(item.publisher),
      'ISBN/ISSN': this.normalizeExcelValue(item.isbn ?? item.issn),
      'Field of Research': this.normalizeExcelValue(item.fieldOfResearch),
      'Requestor': row.requestor,
      'Status': row.status
    };
  }

  private getBackendMessage(err: any, fallback: string): string {
    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    return fallback;
  }

  async approve(row: ReviewRow): Promise<void> {
    if (!this.canApprove(row)) return;

    const result = await Swal.fire({
      title: `Approve ${row.entity.slice(0, -1)}?`,
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: (value) => !String(value ?? '').trim() ? 'Comments are required' : null
    });

    if (!result.isConfirmed) return;
    const comments = String(result.value).trim();

    if (row.entity === 'journals') {
      this.journalService.approve(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Approved', 'Status updated.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Approval failed.'), 'error')
      });
      return;
    }
    if (row.entity === 'books') {
      this.bookService.approve(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Approved', 'Status updated.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Approval failed.'), 'error')
      });
      return;
    }
    if (row.entity === 'chapters') {
      this.chapterService.approve(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Approved', 'Status updated.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Approval failed.'), 'error')
      });
      return;
    }
    this.proceedingsService.approve(row.id, this.username, comments).subscribe({
      next: () => { Swal.fire('Approved', 'Status updated.', 'success'); this.loadTabData(); },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Approval failed.'), 'error')
    });
  }

  async reject(row: ReviewRow): Promise<void> {
    if (!this.canApprove(row)) return;

    const result = await Swal.fire({
      title: `Reject ${row.entity.slice(0, -1)}?`,
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: (value) => !String(value ?? '').trim() ? 'Comments are required' : null
    });

    if (!result.isConfirmed) return;
    const comments = String(result.value).trim();

    if (row.entity === 'journals') {
      this.journalService.reject(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Rejected', 'Status updated.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Rejection failed.'), 'error')
      });
      return;
    }
    if (row.entity === 'books') {
      this.bookService.reject(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Rejected', 'Status updated.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Rejection failed.'), 'error')
      });
      return;
    }
    if (row.entity === 'chapters') {
      this.chapterService.reject(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Rejected', 'Status updated.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Rejection failed.'), 'error')
      });
      return;
    }
    this.proceedingsService.reject(row.id, this.username, comments).subscribe({
      next: () => { Swal.fire('Rejected', 'Status updated.', 'success'); this.loadTabData(); },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Rejection failed.'), 'error')
    });
  }

  async acceptByDhet(row: ReviewRow): Promise<void> {
    if (!this.canAcceptByDhet(row)) return;

    const result = await Swal.fire({
      title: 'Mark as Accepted by DHET?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      inputValidator: (value) => !String(value ?? '').trim() ? 'Comments are required' : null
    });

    if (!result.isConfirmed) return;
    const comments = String(result.value).trim();

    if (row.entity === 'books') {
      this.bookService.acceptByDhet(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Updated', 'Marked as accepted.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Update failed.'), 'error')
      });
      return;
    }
    if (row.entity === 'chapters') {
      this.chapterService.acceptByDhet(row.id, this.username, comments).subscribe({
        next: () => { Swal.fire('Updated', 'Marked as accepted.', 'success'); this.loadTabData(); },
        error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Update failed.'), 'error')
      });
      return;
    }
    this.proceedingsService.acceptByDhet(row.id, this.username, comments).subscribe({
      next: () => { Swal.fire('Updated', 'Marked as accepted.', 'success'); this.loadTabData(); },
      error: (err) => Swal.fire('Error', this.getBackendMessage(err, 'Update failed.'), 'error')
    });
  }
}

