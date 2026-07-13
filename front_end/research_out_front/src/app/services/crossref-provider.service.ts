import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { JournalLookupResult } from '../models/journal-lookup.model';

interface CrossrefJournalResponse {
  message?: {
    title?: string;
    publisher?: string;
    ISSN?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class CrossrefProvider {
  private readonly baseUrl = ' https://api.crossref.org/journals';

  constructor(private http: HttpClient) {}

  lookupByIssn(issn: string): Observable<Partial<JournalLookupResult>> {
    const normalizedIssn = this.normalizeIssn(issn);
    if (!normalizedIssn) {
      return of({});
    }

    const compactIssn = normalizedIssn.replace('-', '');
    return this.http.get<CrossrefJournalResponse>(`${this.baseUrl}/${compactIssn}`).pipe(
      map(response => {
        const message = response?.message;
        if (!message) {
          return {};
        }

        const issnList = message.ISSN ?? [];
        return {
          publisher: this.asNonEmpty(message.publisher),
          issn: this.normalizeIssn(issnList[0]),
          eissn: this.normalizeIssn(issnList[1]),
          source: 'Crossref' as const
        };
      }),
      catchError(() => of({}))
    );
  }

  private asNonEmpty(value: unknown): string | undefined {
    const text = String(value ?? '').trim();
    return text ? text : undefined;
  }

  private normalizeIssn(value?: string): string | undefined {
    const compact = String(value ?? '')
      .toUpperCase()
      .replace(/[^0-9X]/g, '');

    if (compact.length !== 8) {
      return undefined;
    }

    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
}

