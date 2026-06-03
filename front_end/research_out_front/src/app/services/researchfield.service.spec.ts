import { TestBed } from '@angular/core/testing';

import { ResearchfieldService } from './researchfield.service';

describe('ResearchfieldService', () => {
  let service: ResearchfieldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResearchfieldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
