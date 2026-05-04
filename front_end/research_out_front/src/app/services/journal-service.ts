import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Journal} from '../models/journal.model';
import {Department, Faculty} from '../models/common.model';


@Injectable({
  providedIn: 'root'
})
export class JournalService {

  private baseurl = environment.apiUrl+"api/";
  constructor(private http: HttpClient) { }

  getFaculties(): Observable<Faculty[]> {
debugger
    return this.http.get<Faculty[]>(`${this.baseurl+"facultydepartment"}/faculties`);
  }
  loud_journals(username:string):Observable<any>
  {
    debugger;
    const headers = {'Content-Type': 'application/json'};
    return this.http.get( this.baseurl+"research-outputs/load/"+username, { headers })
  }

  create(journal: Journal): Observable<Journal> {
    debugger;
    return this.http.post<Journal>(this.baseurl+"journal", journal);
  }

  update(id: number, journal: Journal): Observable<Journal> {
        debugger;
    return this.http.put<Journal>(`${this.baseurl+"journal"}/${id}`, journal);
  }
  save(journal: Journal): Observable<Journal> {
    debugger;
    if (!journal.id || journal.id === 0) {
      return this.create(journal);
    }
    return this.update(journal.id, journal);
  }


  getById(id: number): Observable<Journal> {
    return this.http.get<Journal>(`${this.baseurl+"journal"}/${id}`);
  }

  getDepartmentsByFaculty(facultyId: number) {
    debugger;
    return this.http.get<Department[]>(
      `${this.baseurl+"facultydepartment"}/faculties/${facultyId}/departments`
    );
  }
  getAllJournals(): Observable<Journal[]> {
    return this.http.get<Journal[]>(this.baseurl + "journal");
  }



  exists(title: string, issn: string, id?: number): Observable<boolean> {
    let url = `${this.baseurl}journal/exists?title=${encodeURIComponent(title)}&issn=${encodeURIComponent(issn)}`;

    if (id) {
      url += `&id=${id}`;
    }

    return this.http.get<boolean>(url);
  }











}
