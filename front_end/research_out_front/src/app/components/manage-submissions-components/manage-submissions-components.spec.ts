import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSubmissionsComponents } from './manage-submissions-components';

describe('ManageSubmissionsComponents', () => {
  let component: ManageSubmissionsComponents;
  let fixture: ComponentFixture<ManageSubmissionsComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageSubmissionsComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageSubmissionsComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
