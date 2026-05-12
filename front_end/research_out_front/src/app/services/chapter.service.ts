import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Chapter} from '../models/Chapter';
import {Department, Faculty} from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {

  private baseurl = environment.apiUrl+"api/";
  constructor(private http: HttpClient) { }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }

  create(chapter: Chapter): Observable<Chapter> {
    return this.http.post<Chapter>(this.baseurl+"chapters", chapter);
  }

  update(id: number, chapter: Chapter): Observable<Chapter> {
    return this.http.put<Chapter>(`${this.baseurl+"chapters"}/${id}`, chapter);
  }

  save(chapter: Chapter): Observable<Chapter> {
    if (!chapter.id || chapter.id === 0) {
      return this.create(chapter);
    }
    return this.update(chapter.id, chapter);
  }

  getById(id: number): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.baseurl+"chapters"}/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number) {
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }

  getAll(): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(this.baseurl + "chapters");
  }

  exists(title: string, isbn: string, id?: number): Observable<boolean> {
    let params = `title=${title}&isbn=${isbn}`;
    if (id) {
      params += `&id=${id}`;
    }
    return this.http.get<boolean>(`${this.baseurl}chapters/exists?${params}`);
  }
}

