import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment-url';
import { Book } from '../models/Book';
import { Department, Faculty } from '../models/common.model';

export interface BookSubmissionLog {
  id: number;
  timestamp?: string;
  action?: string;
  performedBy?: string;
  fromStatus?: string;
  toStatus?: string;
  comments?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {

  private baseurl = environment.apiUrl + 'api/';

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
      throw new Error('Username is required to save book');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Username': resolvedUsername
    });
  }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl}facultydepartment/faculties`);
  }

  create(book: Book, username?: string): Observable<Book> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Book>(this.baseurl + 'books', book, { headers });
  }

  update(id: number, book: Book, username?: string): Observable<Book> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.put<Book>(`${this.baseurl}books/${id}`, book, { headers });
  }

  save(book: Book, username?: string): Observable<Book> {
    if (!book.id || book.id === 0) {
      return this.create(book, username);
    }
    return this.update(book.id, book, username);
  }

  getById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.baseurl}books/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number): Observable<Department[]> {
    return this.http.get<Department[]>(
      `${this.baseurl}facultydepartment/faculties/${facultyId}/departments`
    );
  }

  getAll(username?: string): Observable<Book[]> {
    const resolvedUsername = this.resolveUsername(username);
    if (!resolvedUsername) {
      return this.http.get<Book[]>(this.baseurl + 'books');
    }
    return this.http.get<Book[]>(`${this.baseurl}books?mine=true&username=${encodeURIComponent(resolvedUsername)}`);
  }

  exists(title: string, isbn: string, id?: number): Observable<boolean> {
    let params = `title=${title}&isbn=${isbn}`;
    if (id) {
      params += `&id=${id}`;
    }
    return this.http.get<boolean>(`${this.baseurl}books/exists?${params}`);
  }

  submitForReview(id: number, username?: string, comments?: string): Observable<Book> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Book>(`${this.baseurl}books/${id}/submit`, { comments: comments ?? '' }, { headers });
  }

  approve(id: number, username?: string, comments?: string): Observable<Book> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Book>(`${this.baseurl}books/${id}/approve`, { comments: comments ?? '' }, { headers });
  }

  reject(id: number, username?: string, comments?: string): Observable<Book> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Book>(`${this.baseurl}books/${id}/reject`, { comments: comments ?? '' }, { headers });
  }

  acceptByDhet(id: number, username?: string, comments?: string): Observable<Book> {
    const headers = this.buildRequiredUsernameHeaders(username);
    return this.http.post<Book>(`${this.baseurl}books/${id}/accept-dhet`, { comments: comments ?? '' }, { headers });
  }

  getTimeline(id: number): Observable<BookSubmissionLog[]> {
    return this.http.get<BookSubmissionLog[]>(`${this.baseurl}books/${id}/timeline`);
  }
}

