import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSubmissionDetailsComponents } from './manage-submission-details-components';

describe('ManageSubmissionDetailsComponents', () => {
  let component: ManageSubmissionDetailsComponents;
  let fixture: ComponentFixture<ManageSubmissionDetailsComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageSubmissionDetailsComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageSubmissionDetailsComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
