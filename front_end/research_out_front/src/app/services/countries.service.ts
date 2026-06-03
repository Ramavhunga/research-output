import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {
  private baseUrl ='https://restcountries.com/v3.1';

  constructor(private http: HttpClient) {
  }
  searchCountries(term: string): Observable<string[]> {
    if (!term || term.length < 2) {
      return new Observable<string[]>(obs => obs.next([]));
    }

    return this.http
      .get<any[]>(`${this.baseUrl}/name/${term}`)
      .pipe(
        map(res =>
          res.map(c => c.name?.common).filter(Boolean)
        )
      );
  }
}
