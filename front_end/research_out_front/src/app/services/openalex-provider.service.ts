import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { JournalLookupResult } from '../models/journal-lookup.model';

interface OpenAlexSource {
  display_name?: string;
  host_organization_name?: string;
  is_oa?: boolean;
  issn?: string[];
  topics?: Array<{
    field?: {
      display_name?: string;
    };
  }>;
}

interface OpenAlexResponse {
  results?: OpenAlexSource[];
}

@Injectable({
  providedIn: 'root'
})
export class OpenAlexProvider {
  private readonly baseUrl = 'https://api.openalex.org/sources';

  constructor(private http: HttpClient) {}

  lookupByIssn(issn: string): Observable<Partial<JournalLookupResult>> {
    const normalizedIssn = this.normalizeIssn(issn);
    if (!normalizedIssn) {
      return of({});
    }

    const params = new HttpParams()
      .set('filter', `issn:${normalizedIssn}`)
      .set('per-page', '1');

    return this.http.get<OpenAlexResponse>(this.baseUrl, { params }).pipe(
      map(response => {
        const source = response?.results?.[0];
        if (!source) {
          return {};
        }

        const issnList = source.issn ?? [];
        return {
          journalTitle: this.asNonEmpty(source.display_name),
          publisher: this.asNonEmpty(source.host_organization_name),
          openaccess: typeof source.is_oa === 'boolean' ? source.is_oa : undefined,
          fieldofsearch: this.asNonEmpty(source.topics?.[0]?.field?.display_name),
          issn: this.normalizeIssn(issnList[0]),
          eissn: this.normalizeIssn(issnList[1]),
          source: 'OpenAlex' as const
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

