import { Component } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-journal-detail-component',
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './journal-detail-component.html',
  styleUrl: './journal-detail-component.css'
})
export class JournalDetailComponent {
  showPreview = false;
  previewJson = '';
  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    const journal = this.router.getCurrentNavigation()?.extras.state?.['journal'];
    this.form = this.fb.group({

    })

  }
}
