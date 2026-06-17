import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Chapter} from '../models/Chapter';
import {Department, Faculty} from '../models/common.model';
import { SubmissionLog } from '../models/submission-log.model';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {

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
      throw new Error('Username is required to save chapter');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Username': resolvedUsername
    });
  }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }

  create(chapter: Chapter, username?: string): Observable<Chapter> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Chapter>(this.baseurl+"chapters", chapter, { headers });
  }

  update(id: number, chapter: Chapter, username?: string): Observable<Chapter> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.put<Chapter>(`${this.baseurl+"chapters"}/${id}`, chapter, { headers });
  }

  save(chapter: Chapter, username?: string): Observable<Chapter> {
    if (!chapter.id || chapter.id === 0) {
      return this.create(chapter, username);
    }
    return this.update(chapter.id, chapter, username);
  }

  getById(id: number): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.baseurl+"chapters"}/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number) {
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }

  getAll(username?: string): Observable<Chapter[]> {
    const resolvedUsername = this.resolveUsername(username);
    if (!resolvedUsername) {
      return this.http.get<Chapter[]>(this.baseurl + 'chapters');
    }

    const headers = new HttpHeaders({ 'X-Username': resolvedUsername });
    return this.http.get<Chapter[]>(
      `${this.baseurl}chapters?mine=true&username=${encodeURIComponent(resolvedUsername)}`,
      { headers }
    );
  }

  exists(title: string, isbn: string, id?: number): Observable<boolean> {
    let params = `title=${title}&isbn=${isbn}`;
    if (id) {
      params += `&id=${id}`;
    }
    return this.http.get<boolean>(`${this.baseurl}chapters/exists?${params}`);
  }

  submitForReview(id: number, username?: string, comments?: string): Observable<Chapter> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Chapter>(`${this.baseurl}chapters/${id}/submit`, { comments: comments ?? '' }, { headers });
  }

  approve(id: number, username?: string, comments?: string): Observable<Chapter> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Chapter>(`${this.baseurl}chapters/${id}/approve`, { comments: comments ?? '' }, { headers });
  }

  reject(id: number, username?: string, comments?: string): Observable<Chapter> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Chapter>(`${this.baseurl}chapters/${id}/reject`, { comments: comments ?? '' }, { headers });
  }

  acceptByDhet(id: number, username?: string, comments?: string): Observable<Chapter> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Chapter>(`${this.baseurl}chapters/${id}/accept-dhet`, { comments: comments ?? '' }, { headers });
  }

  getTimeline(id: number): Observable<SubmissionLog[]> {
    return this.http.get<SubmissionLog[]>(`${this.baseurl}chapters/${id}/timeline`);
  }
}

