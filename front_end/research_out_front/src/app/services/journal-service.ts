import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JournalService {
  constructor(private http: HttpClient) { }




  loud_journals(username:string):Observable<any>
  {
    const headers = {'Content-Type': 'application/json'};
    return this.http.get( "", { headers })
  }

}
