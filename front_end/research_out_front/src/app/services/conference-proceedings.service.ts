import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Department, Faculty} from '../models/common.model';
import {ConferenceProceedings} from '../models/ConfrenceProceedings';


@Injectable({
  providedIn: 'root'
})
export class ConferenceProceedingsService {

  private baseurl = environment.apiUrl+"api/";
  constructor(private http: HttpClient) { }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }

  create(proceedings: ConferenceProceedings): Observable<ConferenceProceedings> {
    return this.http.post<ConferenceProceedings>(this.baseurl+"conference-proceedings", proceedings);
  }

  update(id: number, proceedings: ConferenceProceedings): Observable<ConferenceProceedings> {
    return this.http.put<ConferenceProceedings>(`${this.baseurl+"conference-proceedings"}/${id}`, proceedings);
  }

  save(proceedings: ConferenceProceedings): Observable<ConferenceProceedings> {
    if (!proceedings.id || proceedings.id === 0) {
      return this.create(proceedings);
    }
    return this.update(proceedings.id, proceedings);
  }

  getById(id: number): Observable<ConferenceProceedings> {
    return this.http.get<ConferenceProceedings>(`${this.baseurl+"conference-proceedings"}/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number) {
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }

  getAll(): Observable<ConferenceProceedings[]> {
    return this.http.get<ConferenceProceedings[]>(this.baseurl + "conference-proceedings");
  }

  exists(title: string, isbn: string, id?: number): Observable<boolean> {
    let url = `${this.baseurl}conference-proceedings/exists?title=${encodeURIComponent(title)}&isbn=${encodeURIComponent(isbn)}`;

    if (id) {
      url += `&id=${id}`;
    }

    return this.http.get<boolean>(url);
  }
}
