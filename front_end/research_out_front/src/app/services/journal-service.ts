import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environment/environment-url';
import {Journal} from '../models/journal.model';


@Injectable({
  providedIn: 'root'
})
export class JournalService {

  private baseurl = environment.apiUrl+"/api/journal";
  constructor(private http: HttpClient) { }


  loud_journals(username:string):Observable<any>
  {
    const headers = {'Content-Type': 'application/json'};
    return this.http.get( this.baseurl, { headers })
  }

  create(journal: Journal): Observable<Journal> {
    debugger;
    return this.http.post<Journal>(this.baseurl, journal);
  }

  update(id: number, journal: Journal): Observable<Journal> {
    return this.http.put<Journal>(`${this.baseurl}/${id}`, journal);
  }
  save(journal: Journal): Observable<Journal> {
    if (!journal.id || journal.id === 0) {
      return this.create(journal);
    }
    return this.update(journal.id, journal);
  }
  getById(id: number): Observable<Journal> {
    return this.http.get<Journal>(`${this.baseurl}/${id}`);
  }





}
