import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchOutput } from './research-output';

describe('ResearchOutput', () => {
  let component: ResearchOutput;
  let fixture: ComponentFixture<ResearchOutput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResearchOutput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResearchOutput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
