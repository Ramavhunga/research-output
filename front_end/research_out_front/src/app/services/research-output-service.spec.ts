import { TestBed } from '@angular/core/testing';

import { ResearchOutputService } from './research-output-service';

describe('ResearchOutputService', () => {
  let service: ResearchOutputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResearchOutputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
