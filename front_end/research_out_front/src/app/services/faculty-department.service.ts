import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment-url';
import { Faculty, Department } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class FacultyDepartmentService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all faculties
   */
  getAllFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseUrl}api/facultydepartment/faculties`);
  }

  /**
   * Get departments by faculty ID
   */
  getDepartmentsByFaculty(facultyId: number): Observable<Department[]> {
    return this.http.get<Department[]>(
      `${this.baseUrl}api/facultydepartment/faculties/${facultyId}/departments`
    );
  }
}

