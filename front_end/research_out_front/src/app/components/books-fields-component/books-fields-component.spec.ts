import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooksFieldsComponent } from './books-fields-component';

describe('BooksFieldsComponent', () => {
  let component: BooksFieldsComponent;
  let fixture: ComponentFixture<BooksFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BooksFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BooksFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
