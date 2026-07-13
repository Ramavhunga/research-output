import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { DhetJournalRecord, JournalLookupResult } from '../models/journal-lookup.model';
import { CrossrefProvider } from './crossref-provider.service';
import { DhETJournalRepository } from './dhet-journal-repository.service';
import { OpenAlexProvider } from './openalex-provider.service';

@Injectable({
  providedIn: 'root'
})
export class JournalLookupService {
  constructor(
    private dhetRepository: DhETJournalRepository,
    private openAlexProvider: OpenAlexProvider,
    private crossrefProvider: CrossrefProvider
  ) {}

  lookupByIssnOrEissn(issn?: string, eissn?: string): Observable<JournalLookupResult> {
    const normalizedIssn = this.normalizeIssn(issn);
    const normalizedEissn = this.normalizeIssn(eissn);

    if (!normalizedIssn && !normalizedEissn) {
      return of(this.notEligibleResult('Please provide an ISSN or EISSN before lookup.'));
    }

    return this.dhetRepository.findByIssnOrEissn(normalizedIssn, normalizedEissn).pipe(
      switchMap((dhetRecord): Observable<JournalLookupResult> => {
        if (!dhetRecord) {
          return of(this.notEligibleResult('Journal not found in DHET-CREST Master Journal List'));
        }

        const dhetResult = this.buildDhetResult(dhetRecord, normalizedIssn, normalizedEissn);
        if (!dhetResult.eligible) {
          return of(dhetResult);
        }

        const lookupIssn = dhetResult.issn ?? normalizedIssn ?? normalizedEissn;
        if (!lookupIssn) {
          return of(dhetResult);
        }

        return this.openAlexProvider.lookupByIssn(lookupIssn).pipe(
          switchMap(openAlexData => {
            const afterOpenAlex = this.mergeWithoutOverwrite(dhetResult, openAlexData);
            const crossrefIssn = afterOpenAlex.issn ?? lookupIssn;

            return this.crossrefProvider.lookupByIssn(crossrefIssn).pipe(
              map(crossrefData => this.mergeWithoutOverwrite(afterOpenAlex, crossrefData))
            );
          })
        );
      }),
      catchError(() => of(this.notEligibleResult('Could not complete journal eligibility lookup. Please try again.')))
    );
  }

  private notEligibleResult(reason: string): JournalLookupResult {
    return {
        eligible: false,
        reason,
        source: 'DHET'
    };
  }

  private buildDhetResult(record: DhetJournalRecord, inputIssn?: string, inputEissn?: string): JournalLookupResult {
    const subsidy = String(record.qualifyForSubsidy ?? '').trim().toUpperCase();
    const isEligible = subsidy === 'YES';
    const dhetNo = this.asNonEmpty(record.nrfJournalId) ?? this.asNonEmpty(record.journalId);
    const journalTitle = this.asNonEmpty(record.standardJournalTitle) ?? this.asNonEmpty(record.title);

    if (!isEligible) {
      return {
        eligible: false,
        dhetNo,
        journalTitle,
        status: this.asNonEmpty(record.status),
        reason: 'Journal is not eligible for DHET subsidy',
        source: 'DHET'
      };
    }

    return {
      eligible: true,
      dhetNo,
      status: this.asNonEmpty(record.status),
      journalTitle,
      publisher: this.asNonEmpty(record.publisher),
      index: this.asNonEmpty(record.index) ?? this.asNonEmpty(record.sourceIndexes),
      comply: 'Yes',
      issn: this.normalizeIssn(record.issn) ?? inputIssn,
      eissn: this.normalizeIssn(record.eissn) ?? inputEissn,
      source: 'DHET'
    };
  }

  private mergeWithoutOverwrite(
    base: JournalLookupResult,
    incoming: Partial<JournalLookupResult>
  ): JournalLookupResult {
    const merged = { ...base };

    this.applyIfMissing(merged, 'journalTitle', incoming.journalTitle);
    this.applyIfMissing(merged, 'publisher', incoming.publisher);
    this.applyIfMissing(merged, 'index', incoming.index);
    this.applyIfMissing(merged, 'issn', this.normalizeIssn(incoming.issn));
    this.applyIfMissing(merged, 'eissn', this.normalizeIssn(incoming.eissn));
    this.applyIfMissing(merged, 'fieldofsearch', incoming.fieldofsearch);

    if (merged.openaccess === undefined && typeof incoming.openaccess === 'boolean') {
      merged.openaccess = incoming.openaccess;
    }

    const hasEnrichment =
      merged.journalTitle !== base.journalTitle
      || merged.publisher !== base.publisher
      || merged.index !== base.index
      || merged.issn !== base.issn
      || merged.eissn !== base.eissn
      || merged.fieldofsearch !== base.fieldofsearch
      || merged.openaccess !== base.openaccess;

    if (hasEnrichment && merged.source === 'DHET') {
      merged.source = 'Merged';
    }

    return merged;
  }

  private applyIfMissing(
    target: JournalLookupResult,
    key: 'journalTitle' | 'publisher' | 'index' | 'issn' | 'eissn' | 'fieldofsearch',
    value: unknown
  ): void {
    const current = target[key];
    const currentText = String(current ?? '').trim();
    if (current !== undefined && current !== null && currentText) {
      return;
    }

    const next = this.asNonEmpty(value);
    if (next) {
      target[key] = next;
    }
  }

  private asNonEmpty(value: unknown): string | undefined {
    const text = String(value ?? '').trim();
    return text ? text : undefined;
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


