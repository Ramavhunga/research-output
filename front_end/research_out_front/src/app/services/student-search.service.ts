import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../environment/environment-url';

export interface StudentSearchResult {
  studentNo: string;
  staffNo: string;
  firstName: string;
  surname: string;
  department: string;
  faculty: string;
  gender: string;
  title?: string;
  postName?: string;
  email?: string;
  type: 'STUDENT' | 'STAFF';
  fullName: string;
  displayText: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentSearchService {
  private readonly baseUrl = environment.apiUrl;
  private readonly studentInfoUrl = this.baseUrl + 'user/student-info';

  constructor(private http: HttpClient) {}

  /**
   * Search for a student/staff by student number or staff number
   * @param query Student/Staff number
   * @returns Observable with student information
   */
  searchByNumber(query: string): Observable<StudentSearchResult | null> {
    if (!query || query.trim().length === 0) {
      return of(null);
    }

    return this.http.get<any>(`${
      this.studentInfoUrl}/${encodeURIComponent(query.trim())}`).pipe(
      switchMap(response => {
        debugger
        const result = this.mapLoginDtoToSearchResult(response);
        return result ? of(result) : of(null);
      }),
      catchError((error: HttpErrorResponse) => {
        debugger;
        console.error('student search failed', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        return of(null);
      })
    );
  }

  /**
   * Search with debounce for real-time suggestions
   * @param query$ Observable of search queries
   * @returns Observable of search results
   */
  searchWithDebounce(query$: Observable<string>): Observable<StudentSearchResult | null> {
    return query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchByNumber(query))
    );
  }

  /**
   * Map LoginDTO response to StudentSearchResult
   */
  private mapLoginDtoToSearchResult(response: any): StudentSearchResult | null {
    try {
      debugger;
      const student = response?.student || {};
      const staff = response?.staff || {};
      const communication = response?.communication || {};

      const studentNo = student?.studentNumber || staff?.personNumber || '';
      const staffNo = staff?.personNumber || student?.studentNumber || '';

      const firstName = student?.firstNames || staff?.firstname || '';
      const surname = student?.surname || staff?.surname || '';
      const fullName = `${firstName} ${surname}`.trim();
      const department = student?.departmentName || staff?.departmentName || '';
      const faculty = student?.facultyName || staff?.faculty || '';
      const gender = student?.gender || staff?.gender || '';
      const title = staff?.title || '';
      const postName = staff?.postName || '';

      if (!studentNo && !staffNo) {
        return null;
      }

      const type = student?.studentNumber ? 'STUDENT' : 'STAFF';
      const displayText = `${fullName} (${staffNo || studentNo}) - ${department}`;

      return {
        studentNo,
        staffNo,
        firstName,
        surname,
        fullName,
        department,
        faculty,
        gender,
        title,
        postName,
        email: this.extractEmail(communication),
        type,
        displayText
      };
    } catch (error) {
      console.error('Error mapping search result:', error);
      return null;
    }
  }

  private extractEmail(communication: any): string {
    if (!communication) return '';
    if (Array.isArray(communication)) {
      const emailItem = communication.find((item: any) =>
        String(item?.communicationType || item?.type || '').toUpperCase().includes('EMAIL')
      );
      return emailItem?.communicationNumber || emailItem?.email || '';
    }
    return communication?.email || communication?.emailAddress || '';
  }
}



