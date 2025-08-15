import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchOutputDetailComponent } from './research-output-detail-component';

describe('ResearchOutputDetailComponent', () => {
  let component: ResearchOutputDetailComponent;
  let fixture: ComponentFixture<ResearchOutputDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResearchOutputDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResearchOutputDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
