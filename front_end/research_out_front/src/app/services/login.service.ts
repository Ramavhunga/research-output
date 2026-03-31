import { Injectable } from '@angular/core';
import {User} from "../interface/user";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from '../../environment/environment-url';


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient) { }

 private urlLogin:string = environment.apiUrl+"user/login"  ;  //"http://localhost:8080/user/login";
  //private urlLogin:string = "https://univenproduction-researchoutput.azuremicroservices.io/user/login";


  login(user: User):Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return this.http.post<any>(this.urlLogin, user, { headers });
  }

}
