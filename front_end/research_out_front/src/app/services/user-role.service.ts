import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment-url';
import { StaffRoleView, UserRoleAssignmentRequest, UserRoleView } from '../models/user-role.model';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private loginService: LoginService) {}

  listUsersWithRoles(): Observable<UserRoleView[]> {
    return this.http.get<UserRoleView[]>(`${this.baseUrl}user/roles`);
  }

  assignRoles(username: string, roles: string[]): Observable<UserRoleView> {
    const payload: UserRoleAssignmentRequest = { roles };
    return this.http.put<UserRoleView>(`${this.baseUrl}user/roles/${encodeURIComponent(username)}`, payload);
  }

  findStaffByNo(staffNo: string): Observable<StaffRoleView> {
    // Interceptor attaches Authorization + X-ITS-Username/X-ITS-Password automatically.
    return this.http.get<StaffRoleView>(`${this.baseUrl}user/roles/staff/${encodeURIComponent(staffNo)}`);
  }

  assignReviewerLevelsByStaffNo(staffNo: string, roles: string[]): Observable<StaffRoleView> {
    // Include ITS credentials in the body as an extra safety net so the backend can
    // authenticate the upstream ITS lookup like /user/login does.
    const payload: UserRoleAssignmentRequest = {
      roles,
      itsUsername: this.loginService.getStoredItsUsername() ?? undefined,
      itsPassword: this.loginService.getStoredItsPassword() ?? undefined
    };
    return this.http.put<StaffRoleView>(`${this.baseUrl}user/roles/staff/${encodeURIComponent(staffNo)}`, payload);
  }
}

