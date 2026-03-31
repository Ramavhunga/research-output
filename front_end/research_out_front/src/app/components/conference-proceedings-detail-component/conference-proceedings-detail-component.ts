import { Component } from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ConfrenceProceedings} from '../../models/ConfrenceProceedings';

@Component({
  selector: 'app-conference-proceedings-detail-component',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './conference-proceedings-detail-component.html',
  styleUrl: './conference-proceedings-detail-component.css'
})
export class ConferenceProceedingsDetailComponent {
  form!: FormGroup;
  showPreview = false;
  previewJson = '';
  faculties = [{ id: 1, name: 'Science' }, { id: 2, name: 'Engineering' }];
  departmentsMap: { [key: number]: any[] } = {};
  constructor(private fb: FormBuilder) {}
  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      year: [null, Validators.required],
      title: ['', Validators.required],
      conferenceName: ['', Validators.required],
      publisher: [''],
      isbn: [''],
      doi: [''],
      urls: [''],
      openaccess: [''],
      fieldofsearch: [null, Validators.required],
      funders: [''],
      publicationfeedescription: [''],
      publishercurrency: [''],
      totalPublicationFeePublisherCurrency: [null],
      publicationfeearticle: [null],
      authorsContributionFee: [null],
      authorsContributionFeeZar: [null],
      editors: [''],
      location: [''],
      date: [''],
      authors: this.fb.array([this.createAuthor()]),
      unitsFG: this.fb.group({
        maxUnitsForPublication: [0],
        totalProportionOfAuthors: [0],
        authorCount: [{ value: 1, disabled: true }],
        totalUnitsClaimed: [{ value: 0, disabled: true }],
        additionalComments: ['']
      }),
      claimingAuthorsContributionFG: this.fb.group({
        proportionOfAuthors: [{ value: 0, disabled: true }],
        authorUnitsClaimed: [{ value: 0, disabled: true }],
        additionalComments: ['']
      })
    });
  }
  get authorsFA(): FormArray {
    return this.form.get('authors') as FormArray;
  }

  createAuthor(): FormGroup {
    return this.fb.group({
      affiliation: [null, Validators.required],
      studentEmployeeNo: ['', Validators.required],
      firstName: ['', Validators.required],
      surname: ['', Validators.required],
      initials: [''],
      gender: [null],
      populationGroup: [''],
      dob: [''],
      orcid: [''],
      countryOfBirth: [''],
      saResidencyStatus: [null],
      disability: [false],
      highestQualification: [null],
      employmentStatus: [null],
      facultyId: [null],
      departmentId: [null],
      academicTitle: [null]
    });
  }

  addAuthor() {
    this.authorsFA.push(this.createAuthor());
  }

  removeAuthor(index: number) {
    this.authorsFA.removeAt(index);
  }

  onFacultyChange(index: number) {
    const facultyId = this.authorsFA.at(index).get('facultyId')?.value;
    if (facultyId === 1) {
      this.departmentsMap[index] = [{ id: 11, name: 'Math' }, { id: 12, name: 'Physics' }];
    } else if (facultyId === 2) {
      this.departmentsMap[index] = [{ id: 21, name: 'Mechanical' }, { id: 22, name: 'Electrical' }];
    } else {
      this.departmentsMap[index] = [];
    }
  }

  preview() {
    this.showPreview = true;
    this.previewJson = JSON.stringify(this.form.getRawValue(), null, 2);
  }

  closePreview() {
    this.showPreview = false;
  }

  reset() {
    this.form.reset();
    this.authorsFA.clear();
    this.authorsFA.push(this.createAuthor());
  }

  autoPopulateForm() {
    this.form.patchValue({
      year: 2025,
      conferenceName: 'International AI Conference',
      title: 'AI in Enterprise Systems',
      editors: 'Dr. A. Smith',
      location: 'Cape Town, South Africa',
      date: '2025-08-15',
      authorsContributionFee: 250,
      authorsContributionFeeZar: 5000
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const proceedings: ConfrenceProceedings = this.form.getRawValue();
      console.log('Submitting Proceedings:', proceedings);
      // this.service.createProceedings(proceedings).subscribe(...)
    } else {
      this.form.markAllAsTouched();
    }
  }

}
