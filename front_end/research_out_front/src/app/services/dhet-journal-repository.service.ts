import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environment/environment-url';
import { DhetJournalRecord } from '../models/journal-lookup.model';

@Injectable({
  providedIn: 'root'
})
export class DhETJournalRepository {
  private readonly baseUrl = `${environment.apiUrl}api/journal-reference`;

  constructor(private http: HttpClient) {}

  findByIssnOrEissn(issn?: string, eissn?: string): Observable<DhetJournalRecord | null> {
    const normalizedIssn = this.normalizeIssn(issn);
    const normalizedEissn = this.normalizeIssn(eissn);

    if (!normalizedIssn && !normalizedEissn) {
      return of(null);
    }

    let params = new HttpParams();
    if (normalizedIssn) {
      params = params.set('issn', normalizedIssn);
    }
    if (normalizedEissn) {
      params = params.set('eissn', normalizedEissn);
    }

    return this.http.get<unknown>(`${this.baseUrl}/lookup`, {
      params,
      headers: this.resolveOptionalUsernameHeader()
    }).pipe(
      map(payload => this.mapRecord(payload)),
      catchError(() => of(null))
    );
  }

  private resolveOptionalUsernameHeader(): HttpHeaders {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      return new HttpHeaders();
    }

    try {
      const loginData = JSON.parse(loginRaw);
      const username = String(loginData?.user?.username ?? loginData?.username ?? '').trim();
      if (!username) {
        return new HttpHeaders();
      }
      return new HttpHeaders({ 'X-Username': username });
    } catch {
      return new HttpHeaders();
    }
  }

  private mapRecord(payload: unknown): DhetJournalRecord | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const raw = payload as Record<string, unknown>;
    return {
      journalId: this.asString(raw['journal_id'] ?? raw['journalId']),
      nrfJournalId: this.asString(raw['nrf_journal_id'] ?? raw['nrfJournalId']),
      standardJournalTitle: this.asString(raw['standard_journal_title'] ?? raw['standardJournalTitle']),
      title: this.asString(raw['title']),
      publisher: this.asString(raw['publisher']),
      status: this.asString(raw['status']),
      index: this.asString(raw['index']),
      sourceIndexes: this.asString(raw['source_indexes'] ?? raw['sourceIndexes']),
      issn: this.normalizeIssn(this.asString(raw['issn'])),
      eissn: this.normalizeIssn(this.asString(raw['eissn'])),
      qualifyForSubsidy: this.asString(raw['qualify_for_subsidy'] ?? raw['qualifyForSubsidy'])
    };
  }

  private asString(value: unknown): string | null {
    const text = String(value ?? '').trim();
    return text ? text : null;
  }

  private normalizeIssn(value?: string | null): string | undefined {
    const compact = String(value ?? '')
      .toUpperCase()
      .replace(/[^0-9X]/g, '');

    if (compact.length !== 8) {
      return undefined;
    }

    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
}

