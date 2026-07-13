import { Injectable } from '@angular/core';
import { User } from '../interface/user';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment-url';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly urlLogin: string = environment.apiUrl + 'user/login';
  private readonly urlStudentInfo: string = environment.apiUrl + 'user/student-info';
  private readonly basicAuthStorageKey = 'basicAuthHeader';

  constructor(private http: HttpClient) { }

  login(user: User): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.buildBasicAuthorization(user)
    });

    return this.http.post<any>(this.urlLogin, user, { headers });
  }

  getStudentInfo(studentNo: string): Observable<any> {
    return this.http.get<any>(`${this.urlStudentInfo}/${studentNo}`);
  }

  persistBasicAuthorization(user: User): void {
    sessionStorage.setItem(this.basicAuthStorageKey, this.buildBasicAuthorization(user));
  }

  clearBasicAuthorization(): void {
    sessionStorage.removeItem(this.basicAuthStorageKey);
  }

  getStoredBasicAuthorization(): string | null {
    return sessionStorage.getItem(this.basicAuthStorageKey);
  }

  private buildBasicAuthorization(user: User): string {
    const username = String(user?.username ?? '').trim();
    const password = String(user?.password ?? '');
    return `Basic ${btoa(`${username}:${password}`)}`;
  }
}
