import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResearchOutputService {

  constructor(private http: HttpClient) { }

  //private urlLogin:string = "http://localhost:8080/api/research-outputs/";
  private urlLoad:string = "https://univenproduction-researchoutput.azuremicroservices.io/api/research-outputs/load/";


  load_research_outputs(username:string):Observable<any> {
    const headers = {'Content-Type': 'application/json'};
    return this.http.get( this.urlLoad+username, { headers })
  }
}
