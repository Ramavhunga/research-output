import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Books} from '../models/Books';
import {Department, Faculty} from '../models/common.model';


@Injectable({
  providedIn: 'root'
})
export class BooksFieldsService {

  private baseurl = environment.apiUrl+"api/";
  constructor(private http: HttpClient) { }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }

  create(book: Books): Observable<Books> {
    return this.http.post<Books>(this.baseurl+"books", book);
  }

  update(id: number, book: Books): Observable<Books> {
    return this.http.put<Books>(`${this.baseurl+"books"}/${id}`, book);
  }

  save(book: Books): Observable<Books> {
    if (!book.id || book.id === 0) {
      return this.create(book);
    }
    return this.update(book.id, book);
  }

  getById(id: number): Observable<Books> {
    return this.http.get<Books>(`${this.baseurl+"books"}/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number) {
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }

  getAll(): Observable<Books[]> {
    return this.http.get<Books[]>(this.baseurl + "books");
  }

  exists(title: string, isbn: string, id?: number): Observable<boolean> {
    let params = `title=${title}&isbn=${isbn}`;
    if (id) {
      params += `&id=${id}`;
    }
    return this.http.get<boolean>(`${this.baseurl}books/exists?${params}`);
  }
}

