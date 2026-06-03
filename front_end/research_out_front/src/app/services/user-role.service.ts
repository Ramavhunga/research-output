import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment-url';
import { StaffRoleView, UserRoleAssignmentRequest, UserRoleView } from '../models/user-role.model';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listUsersWithRoles(): Observable<UserRoleView[]> {
    return this.http.get<UserRoleView[]>(`${this.baseUrl}user/roles`);
  }

  assignRoles(username: string, roles: string[]): Observable<UserRoleView> {
    const payload: UserRoleAssignmentRequest = { roles };
    return this.http.put<UserRoleView>(`${this.baseUrl}user/roles/${encodeURIComponent(username)}`, payload);
  }

  findStaffByNo(staffNo: string): Observable<StaffRoleView> {
    return this.http.get<StaffRoleView>(`${this.baseUrl}user/roles/staff/${encodeURIComponent(staffNo)}`);
  }

  assignReviewerLevelsByStaffNo(staffNo: string, roles: string[]): Observable<StaffRoleView> {
    const payload: UserRoleAssignmentRequest = { roles };
    return this.http.put<StaffRoleView>(`${this.baseUrl}user/roles/staff/${encodeURIComponent(staffNo)}`, payload);
  }
}

