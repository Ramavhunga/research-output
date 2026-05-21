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
  private urlStudentInfo:string = environment.apiUrl+"user/student-info"  ;
  //private urlLogin:string = "https://univenproduction-researchoutput.azuremicroservices.io/user/login";


  login(user: User):Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return this.http.post<any>(this.urlLogin, user, { headers });
  }

  /**
   * Get student information by student number
   * @param studentNo Student/Employee number
   * @returns Observable with complete student information
   */
  getStudentInfo(studentNo: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};
    return this.http.get<any>(`${this.urlStudentInfo}/${studentNo}`, { headers });
  }

}
