import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConferenceProceedingsDetailComponent } from './conference-proceedings-detail-component';

describe('ConferenceProceedingsDetailComponent', () => {
  let component: ConferenceProceedingsDetailComponent;
  let fixture: ComponentFixture<ConferenceProceedingsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConferenceProceedingsDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConferenceProceedingsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
