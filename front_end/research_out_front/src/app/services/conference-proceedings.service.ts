import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Department, Faculty} from '../models/common.model';
import {ConferenceProceedings} from '../models/ConfrenceProceedings';
import { SubmissionLog } from '../models/submission-log.model';


@Injectable({
  providedIn: 'root'
})
export class ConferenceProceedingsService {

  private baseurl = environment.apiUrl+"api/";
  constructor(private http: HttpClient) { }

  private resolveUsername(username?: string): string {
    if (username && username.trim()) {
      return username.trim();
    }

    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      return '';
    }

    try {
      const loginData = JSON.parse(loginRaw);
      return (loginData?.user?.username ?? loginData?.username ?? '').toString().trim();
    } catch {
      return '';
    }
  }

  private buildRequiredUsernameHeaders(username?: string): HttpHeaders {
    const resolvedUsername = this.resolveUsername(username);
    if (!resolvedUsername) {
      throw new Error('Username is required to save proceedings');
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

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }

  create(proceedings: ConferenceProceedings, username?: string): Observable<ConferenceProceedings> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<ConferenceProceedings>(this.baseurl+"conference-proceedings", proceedings, { headers });
  }

  update(id: number, proceedings: ConferenceProceedings, username?: string): Observable<ConferenceProceedings> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.put<ConferenceProceedings>(`${this.baseurl+"conference-proceedings"}/${id}`, proceedings, { headers });
  }

  save(proceedings: ConferenceProceedings, username?: string): Observable<ConferenceProceedings> {
    if (!proceedings.id || proceedings.id === 0) {
      return this.create(proceedings, username);
    }
    return this.update(proceedings.id, proceedings, username);
  }

  getById(id: number): Observable<ConferenceProceedings> {
    return this.http.get<ConferenceProceedings>(`${this.baseurl+"conference-proceedings"}/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number) {
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }

  getAll(username?: string): Observable<ConferenceProceedings[]> {
    const resolvedUsername = this.resolveUsername(username);
    if (!resolvedUsername) {
      return this.http.get<ConferenceProceedings[]>(`${this.baseurl}conference-proceedings?summary=true`);
    }

    const headers = this.buildOptionalUsernameHeaders(resolvedUsername);
    return this.http.get<ConferenceProceedings[]>(
      `${this.baseurl}conference-proceedings?mine=true&username=${encodeURIComponent(resolvedUsername)}&summary=true`,
      { headers }
    ).pipe(
      catchError(() => this.http.get<ConferenceProceedings[]>(`${this.baseurl}conference-proceedings?summary=true`))
    );
  }

  submitForReview(id: number, username?: string, comments?: string): Observable<ConferenceProceedings> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<ConferenceProceedings>(
      `${this.baseurl}conference-proceedings/${id}/submit`,
      { comments: comments ?? '' },
      { headers }
    );
  }

  approve(id: number, username?: string, comments?: string): Observable<ConferenceProceedings> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<ConferenceProceedings>(
      `${this.baseurl}conference-proceedings/${id}/approve`,
      { comments: comments ?? '' },
      { headers }
    );
  }

  reject(id: number, username?: string, comments?: string): Observable<ConferenceProceedings> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<ConferenceProceedings>(
      `${this.baseurl}conference-proceedings/${id}/reject`,
      { comments: comments ?? '' },
      { headers }
    );
  }

  acceptByDhet(id: number, username?: string, comments?: string): Observable<ConferenceProceedings> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<ConferenceProceedings>(
      `${this.baseurl}conference-proceedings/${id}/accept-dhet`,
      { comments: comments ?? '' },
      { headers }
    );
  }

  getTimeline(id: number): Observable<SubmissionLog[]> {
    return this.http.get<SubmissionLog[]>(`${this.baseurl}conference-proceedings/${id}/timeline`);
  }

  exists(title: string, isbn: string, id?: number): Observable<boolean> {
    let url = `${this.baseurl}conference-proceedings/exists?titleOfContribution=${encodeURIComponent(title)}&issn=${encodeURIComponent(isbn)}`;

    if (id) {
      url += `&id=${id}`;
    }

    return this.http.get<boolean>(url);
  }
}
