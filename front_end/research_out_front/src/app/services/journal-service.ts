import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {catchError, map, Observable, of, switchMap} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Journal} from '../models/journal.model';
import {Department, Faculty} from '../models/common.model';
import {JournalApproval} from '../models/journal-approval.model';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}


@Injectable({
  providedIn: 'root'
})
export class JournalService {

  private baseurl = environment.apiUrl+"api/";
  constructor(private http: HttpClient) { }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }
  loud_journals(username:string):Observable<any>
  {
    const headers = {'Content-Type': 'application/json'};
    return this.http.get( this.baseurl+"research-outputs/load/"+username, { headers })
  }

  private resolveUsername(username?: string): string {
    return (username ?? this.getUsernameFromSession()).trim();
  }

  private buildUsernameHeaders(username?: string): HttpHeaders {
    const resolvedUsername = this.resolveUsername(username);
    if (!resolvedUsername) {
      throw new Error('Username is required to save journal');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Username': resolvedUsername
    });
  }

  private buildOptionalUsernameHeaders(username?: string): HttpHeaders {
    const resolvedUsername = this.resolveUsername(username);
    if (!resolvedUsername) {
      return new HttpHeaders();
    }
    return new HttpHeaders({ 'X-Username': resolvedUsername });
  }

  private getUsernameFromSession(): string {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      return '';
    }

    try {
      const loginData = JSON.parse(loginRaw);
      return loginData?.user?.username
        ?? loginData?.username
        ?? loginData?.staff?.personNumber
        ?? '';
    } catch {
      return '';
    }
  }

  getCurrentUsername(): string {
    return this.getUsernameFromSession();
  }

  create(journal: Journal, username?: string): Observable<Journal> {
    const headers = this.buildUsernameHeaders(username);
    return this.http.post<Journal>(this.baseurl+"journal", journal, { headers });
  }

  update(id: number, journal: Journal, username?: string): Observable<Journal> {
    const headers = this.buildUsernameHeaders(username);
    return this.http.put<Journal>(`${this.baseurl+"journal"}/${id}`, journal, { headers });
  }
  save(journal: Journal, username?: string): Observable<Journal> {
    if (!journal.id || journal.id === 0) {
      return this.create(journal, username);
    }
    return this.update(journal.id, journal, username);
  }


  getById(id: number): Observable<Journal> {
    return this.http.get<Journal>(`${this.baseurl+"journal"}/${id}`);
  }

  exportJournalById(id: number): Observable<Blob> {
    return this.http.get(`${this.baseurl}journal/${id}/export`, {
      responseType: 'blob'
    });
  }

  exportReadyForPostingJournals(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseurl}journal/export`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  submitForReview(id: number, username?: string, comments?: string): Observable<Journal> {
    const headers = this.buildUsernameHeaders(username);
    return this.http.post<Journal>(`${this.baseurl}journal/${id}/submit`, { comments: comments ?? '' }, { headers });
  }

  approve(id: number, username?: string, comments?: string): Observable<Journal> {
    const headers = this.buildUsernameHeaders(username);
    return this.http.post<Journal>(`${this.baseurl}journal/${id}/approve`, { comments: comments ?? '' }, { headers });
  }

  reject(id: number, username?: string, comments?: string): Observable<Journal> {
    const headers = this.buildUsernameHeaders(username);
    return this.http.post<Journal>(`${this.baseurl}journal/${id}/reject`, { comments: comments ?? '' }, { headers });
  }

  transitionStatus(id: number, status: string, username?: string): Observable<Journal> {
    const headers = this.buildUsernameHeaders(username);
    return this.http.patch<Journal>(`${this.baseurl}journal/${id}/status`, { status }, { headers });
  }

  markAsPostedToDhet(id: number, username?: string): Observable<Journal> {
    const resolvedUsername = this.resolveUsername(username);
    return this.getById(id).pipe(
      switchMap(journal => this.update(id, { ...journal, status: 'POSTED_TO_DHET' }, resolvedUsername))
    );
  }

  getTimeline(id: number): Observable<JournalApproval[]> {
    return this.http.get<JournalApproval[]>(`${this.baseurl}journal/${id}/timeline`);
  }

  getJournalsByStatus(status: string, username?: string): Observable<Journal[]> {
    const headers = this.buildOptionalUsernameHeaders(username);
    return this.http.get<Journal[]>(`${this.baseurl}journal?status=${encodeURIComponent(status)}&summary=true`, { headers });
  }

  getReviewQueuePage(
    username: string,
    page: number,
    size: number,
    status?: string,
    search?: string
  ): Observable<PageResponse<Journal>> {
    const resolvedUsername = this.resolveUsername(username);
    const headers = resolvedUsername
      ? new HttpHeaders({ 'X-Username': resolvedUsername })
      : new HttpHeaders();
    const params = [
      `page=${page}`,
      `size=${size}`
    ];

    if (resolvedUsername) {
      params.push(`username=${encodeURIComponent(resolvedUsername)}`);
    }

    if (status && status.trim() && status.toUpperCase() !== 'ALL') {
      params.push(`status=${encodeURIComponent(status.trim())}`);
    }

    if (search && search.trim()) {
      params.push(`search=${encodeURIComponent(search.trim())}`);
    }

    return this.http.get<PageResponse<Journal>>(`${this.baseurl}journal/review-queue?${params.join('&')}`, { headers })
      .pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, number: page, size })));
  }

  getReviewQueue(username: string, roles: string[]): Observable<Journal[]> {
    const normalized = (roles ?? []).map(role => (role || '').toUpperCase());
    const hasReviewAccess = normalized.includes('ADMIN') || normalized.includes('REVIEWER_LEVEL_1') || normalized.includes('REVIEWER_LEVEL_2');
    if (!hasReviewAccess) {
      return of([]);
    }

    return this.getReviewQueuePage(username, 0, 100, 'ALL', '').pipe(
      map(response => response.content ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * OPTIMIZATION: Get all dashboard stats in a single API call instead of waiting for individual journal loads
   * This replaces the need for getAllJournals() + multiple processing calls
   */
  getDashboardStats(username?: string, role?: string): Observable<any> {
    const headers = new HttpHeaders({ 'X-Username': username || '' });
    let url = `${this.baseurl}dashboard/stats`;
    if (role) {
      url += `?role=${encodeURIComponent(role)}`;
    }
    return this.http.get<any>(url, { headers }).pipe(
      catchError(() => of(null))
    );
  }

  getDepartmentsByFaculty(facultyId: number) {
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }
  getAllJournals(username?: string): Observable<Journal[]> {
    const resolvedUsername = this.resolveUsername(username);
    if (!resolvedUsername) {
      return this.http.get<Journal[]>(`${this.baseurl}journal?summary=true`);
    }
    const headers = new HttpHeaders({ 'X-Username': resolvedUsername });
    return this.http.get<Journal[]>(`${this.baseurl}journal?mine=true&username=${encodeURIComponent(resolvedUsername)}&summary=true`, { headers })
      .pipe(catchError(() => this.http.get<Journal[]>(`${this.baseurl}journal?summary=true`)));
  }

  getAllJournalsForReview(): Observable<Journal[]> {
    return this.http.get<Journal[]>(`${this.baseurl}journal?summary=true`);
  }

  exists(title: string, issn: string, id?: number): Observable<boolean> {
    let url = `${this.baseurl}journal/exists?title=${encodeURIComponent(title)}&issn=${encodeURIComponent(issn)}`;

    if (id) {
      url += `&id=${id}`;
    }

    return this.http.get<boolean>(url);
  }

  lookupByIssnOrEissn(issn?: string, eissn?: string, id?: number): Observable<Journal | null> {
    const query: string[] = [];
    const normalizedIssn = String(issn ?? '').trim();
    const normalizedEissn = String(eissn ?? '').trim();

    if (normalizedIssn) {
      query.push(`issn=${encodeURIComponent(normalizedIssn)}`);
    }
    if (normalizedEissn) {
      query.push(`eissn=${encodeURIComponent(normalizedEissn)}`);
    }
    if (id !== undefined && id !== null && Number.isFinite(id)) {
      query.push(`id=${id}`);
    }

    if (query.length === 0) {
      return of(null);
    }

    return this.http.get<Journal>(`${this.baseurl}journal/lookup?${query.join('&')}`).pipe(
      map((journal) => journal ?? null),
      catchError(() => of(null))
    );
  }

}
