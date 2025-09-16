import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooksFieldsDetailComponent } from './books-fields-detail-component';

describe('BooksFieldsDetailComponent', () => {
  let component: BooksFieldsDetailComponent;
  let fixture: ComponentFixture<BooksFieldsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BooksFieldsDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BooksFieldsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
