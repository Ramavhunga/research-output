import { Injectable } from '@angular/core';
import {environment} from '../../environment/environment-url';
import { HttpClient, HttpParams } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class ResearchfieldService {

  private baseurl = environment.apiUrl+"api/research-fields";

  constructor(private http: HttpClient) {}

  search(term: string) {
    const params = new HttpParams().set('search', term);
    return this.http.get<any[]>(this.baseurl + '/autocomplete', { params });
  }


  getAll() {
    return this.http.get<any[]>(this.baseurl);
  }


}
