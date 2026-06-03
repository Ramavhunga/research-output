import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, forkJoin, map, Observable, of} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Journal} from '../models/journal.model';
import {Department, Faculty} from '../models/common.model';
import {JournalApproval} from '../models/journal-approval.model';


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
      return loginData?.user?.username ?? loginData?.username ?? '';
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

  getTimeline(id: number): Observable<JournalApproval[]> {
    return this.http.get<JournalApproval[]>(`${this.baseurl}journal/${id}/timeline`);
  }

  getJournalsByStatus(status: string, username?: string): Observable<Journal[]> {
    const headers = this.buildOptionalUsernameHeaders(username);
    return this.http.get<Journal[]>(`${this.baseurl}journal?status=${encodeURIComponent(status)}`, { headers });
  }

  getReviewQueue(username: string, roles: string[]): Observable<Journal[]> {
    const normalized = (roles ?? []).map(role => (role || '').toUpperCase());
    const hasReviewAccess = normalized.includes('ADMIN') || normalized.includes('REVIEWER_LEVEL_1') || normalized.includes('REVIEWER_LEVEL_2');
    if (!hasReviewAccess) {
      return of([]);
    }

    const statuses = [
      'SUBMITTED',
      'UNDER_REVIEW_L1',
      'UNDER_REVIEW_L2',
      'REJECTED_L1',
      'REJECTED_L2',
      'READY_FOR_POSTING',
      // Include legacy statuses so older records remain visible in the same queue.
      'UNDER_REVIEW',
      'REVISION_REQUIRED',
      'APPROVED',
      'REJECTED'
    ];

    return forkJoin(
      statuses.map(status =>
        this.getJournalsByStatus(status, username).pipe(catchError(() => of([] as Journal[])))
      )
    ).pipe(
      map((resultSets) => {
        const flat = resultSets.flat();
        const byId = new Map<number, Journal>();
        flat.forEach(journal => {
          if (journal?.id != null) {
            byId.set(journal.id, journal);
          }
        });
        return Array.from(byId.values()).sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
      }),
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
      return this.http.get<Journal[]>(this.baseurl + "journal");
    }
    const headers = new HttpHeaders({ 'X-Username': resolvedUsername });
    return this.http.get<Journal[]>(`${this.baseurl}journal?mine=true&username=${encodeURIComponent(resolvedUsername)}`, { headers })
      .pipe(catchError(() => this.http.get<Journal[]>(this.baseurl + "journal")));
  }



  exists(title: string, issn: string, id?: number): Observable<boolean> {
    let url = `${this.baseurl}journal/exists?title=${encodeURIComponent(title)}&issn=${encodeURIComponent(issn)}`;

    if (id) {
      url += `&id=${id}`;
    }

    return this.http.get<boolean>(url);
  }











}
