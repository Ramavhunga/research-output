import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {ConfrenceProceedings} from '../models/ConfrenceProceedings';
import {Department, Faculty} from '../models/common.model';


@Injectable({
  providedIn: 'root'
})
export class ConferenceProceedingsService {

  private baseurl = environment.apiUrl+"api/";
  constructor(private http: HttpClient) { }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }

  create(proceedings: ConfrenceProceedings): Observable<ConfrenceProceedings> {
    return this.http.post<ConfrenceProceedings>(this.baseurl+"conference-proceedings", proceedings);
  }

  update(id: number, proceedings: ConfrenceProceedings): Observable<ConfrenceProceedings> {
    return this.http.put<ConfrenceProceedings>(`${this.baseurl+"conference-proceedings"}/${id}`, proceedings);
  }

  save(proceedings: ConfrenceProceedings): Observable<ConfrenceProceedings> {
    if (!proceedings.id || proceedings.id === 0) {
      return this.create(proceedings);
    }
    return this.update(proceedings.id, proceedings);
  }

  getById(id: number): Observable<ConfrenceProceedings> {
    return this.http.get<ConfrenceProceedings>(`${this.baseurl+"conference-proceedings"}/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number) {
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }

  getAll(): Observable<ConfrenceProceedings[]> {
    return this.http.get<ConfrenceProceedings[]>(this.baseurl + "conference-proceedings");
  }

  exists(title: string, isbn: string, id?: number): Observable<boolean> {
    let url = `${this.baseurl}conference-proceedings/exists?title=${encodeURIComponent(title)}&isbn=${encodeURIComponent(isbn)}`;

    if (id) {
      url += `&id=${id}`;
    }

    return this.http.get<boolean>(url);
  }
}
