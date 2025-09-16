import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConferenceProceedingsComponent } from './conference-proceedings-component';

describe('ConferenceProceedingsComponent', () => {
  let component: ConferenceProceedingsComponent;
  let fixture: ComponentFixture<ConferenceProceedingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConferenceProceedingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConferenceProceedingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
