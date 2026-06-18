import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment-url';

export interface DepartmentDeanDTO {
  id: number;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  staffNo: string;
  title: string;
  firstname: string;
  surname: string;
  faculty: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentDeanService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllDeans(): Observable<DepartmentDeanDTO[]> {
    return this.http.get<DepartmentDeanDTO[]>(`${this.baseUrl}api/facultydepartment/deans`);
  }

  getDeansByDepartment(departmentId: number): Observable<DepartmentDeanDTO[]> {
    return this.http.get<DepartmentDeanDTO[]>(`${this.baseUrl}api/facultydepartment/department/${departmentId}/deans`);
  }

  assignDean(departmentId: number, staffNo: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}api/facultydepartment/department/${departmentId}/dean/${encodeURIComponent(staffNo)}`, {});
  }

  deleteDean(departmentId: number, staffNo: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}api/facultydepartment/department/${departmentId}/dean/${encodeURIComponent(staffNo)}`);
  }

  deleteDeanById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}api/facultydepartment/dean/${id}`);
  }
}

