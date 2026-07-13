import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CrossrefProvider } from './crossref-provider.service';
import { DhETJournalRepository } from './dhet-journal-repository.service';
import { JournalLookupService } from './journal-lookup.service';
import { OpenAlexProvider } from './openalex-provider.service';

describe('JournalLookupService', () => {
  let service: JournalLookupService;
  let dhetRepository: jasmine.SpyObj<DhETJournalRepository>;
  let openAlexProvider: jasmine.SpyObj<OpenAlexProvider>;
  let crossrefProvider: jasmine.SpyObj<CrossrefProvider>;

  beforeEach(() => {
    dhetRepository = jasmine.createSpyObj<DhETJournalRepository>('DhETJournalRepository', ['findByIssnOrEissn']);
    openAlexProvider = jasmine.createSpyObj<OpenAlexProvider>('OpenAlexProvider', ['lookupByIssn']);
    crossrefProvider = jasmine.createSpyObj<CrossrefProvider>('CrossrefProvider', ['lookupByIssn']);

    TestBed.configureTestingModule({
      providers: [
        JournalLookupService,
        { provide: DhETJournalRepository, useValue: dhetRepository },
        { provide: OpenAlexProvider, useValue: openAlexProvider },
        { provide: CrossrefProvider, useValue: crossrefProvider }
      ]
    });

    service = TestBed.inject(JournalLookupService);
  });

  it('returns ineligible when journal is not in DHET list and never calls external providers', (done) => {
    dhetRepository.findByIssnOrEissn.and.returnValue(of(null));

    service.lookupByIssnOrEissn('1234-5678').subscribe(result => {
      expect(result.eligible).toBeFalse();
      expect(result.reason).toContain('Journal not found');
      expect(openAlexProvider.lookupByIssn).not.toHaveBeenCalled();
      expect(crossrefProvider.lookupByIssn).not.toHaveBeenCalled();
      done();
    });
  });

  it('returns ineligible when DHET qualify_for_subsidy is NO and never calls external providers', (done) => {
    dhetRepository.findByIssnOrEissn.and.returnValue(of({
      nrfJournalId: 'J001',
      standardJournalTitle: 'Example Journal',
      status: 'ACTIVE',
      qualifyForSubsidy: 'No'
    }));

    service.lookupByIssnOrEissn('1234-5678').subscribe(result => {
      expect(result.eligible).toBeFalse();
      expect(result.reason).toContain('not eligible');
      expect(result.dhetNo).toBe('J001');
      expect(openAlexProvider.lookupByIssn).not.toHaveBeenCalled();
      expect(crossrefProvider.lookupByIssn).not.toHaveBeenCalled();
      done();
    });
  });

  it('enriches missing fields without overwriting DHET values', (done) => {
    dhetRepository.findByIssnOrEissn.and.returnValue(of({
      nrfJournalId: 'J999',
      standardJournalTitle: 'DHET Journal Title',
      status: 'ACTIVE',
      publisher: 'DHET Publisher',
      issn: '1234-5678',
      qualifyForSubsidy: 'Yes'
    }));

    openAlexProvider.lookupByIssn.and.returnValue(of({
      journalTitle: 'OpenAlex Title Should Not Override',
      openaccess: true,
      fieldofsearch: 'Computer Science'
    }));

    crossrefProvider.lookupByIssn.and.returnValue(of({
      publisher: 'Crossref Publisher Should Not Override',
      eissn: '8765-4321'
    }));

    service.lookupByIssnOrEissn('1234-5678').subscribe(result => {
      expect(result.eligible).toBeTrue();
      expect(result.journalTitle).toBe('DHET Journal Title');
      expect(result.publisher).toBe('DHET Publisher');
      expect(result.openaccess).toBeTrue();
      expect(result.fieldofsearch).toBe('Computer Science');
      expect(result.eissn).toBe('8765-4321');
      expect(result.source).toBe('Merged');
      done();
    });
  });
});

