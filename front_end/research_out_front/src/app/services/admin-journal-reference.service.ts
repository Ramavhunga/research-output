import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment-url';
import { AdminJournalReference, AdminJournalUploadResponse } from '../models/admin-journal-reference.model';

@Injectable({
  providedIn: 'root'
})
export class AdminJournalReferenceService {
  private readonly baseUrl = `${environment.apiUrl}api/admin/journal-reference`;

  constructor(private http: HttpClient) {}

  uploadExcel(file: File, username: string): Observable<AdminJournalUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    const headers = new HttpHeaders({
      'X-Username': username
    });

    return this.http.post<AdminJournalUploadResponse>(`${this.baseUrl}/upload`, formData, { headers });
  }

  getAll(username: string): Observable<AdminJournalReference[]> {
    const headers = new HttpHeaders({
      'X-Username': username
    });

    return this.http.get<AdminJournalReference[]>(this.baseUrl, { headers });
  }
}



