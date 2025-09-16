import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JournalDetailComponent } from './journal-detail-component';

describe('JournalDetailComponent', () => {
  let component: JournalDetailComponent;
  let fixture: ComponentFixture<JournalDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JournalDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
