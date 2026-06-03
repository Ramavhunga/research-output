import { Injectable } from '@angular/core';
import {environment} from '../../environment/environment-url';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface Publisher {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublisherService {

  private baseurl = environment.apiUrl+"api/publisher";

  constructor(private http: HttpClient) {}

  getAll(): Observable<Publisher[]> {
    return this.http.get<Publisher[]>(`${this.baseurl}/all`);
  }
}
