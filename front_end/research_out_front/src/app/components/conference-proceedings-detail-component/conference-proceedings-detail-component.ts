import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {ConfrenceProceedings} from '../../models/ConfrenceProceedings';
import {
  Authors,
  Department, Faculty
} from '../../models/common.model';
import {ConferenceProceedingsService} from '../../services/conference-proceedings.service';
import {debounceTime, distinctUntilChanged, switchMap, Subscription, of, map} from 'rxjs';
import {CountriesService} from '../../services/countries.service';
import Swal from 'sweetalert2';
import {ResearchfieldService} from '../../services/researchfield.service';
import {Publisher, PublisherService} from '../../services/publisher.service';

@Component({
  selector: 'app-conference-proceedings-detail-component',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './conference-proceedings-detail-component.html',
  standalone: true,
  styleUrl: './conference-proceedings-detail-component.css'
})
export class ConferenceProceedingsDetailComponent {
  showPreview = false;
  previewJson = '';
  form: FormGroup;
  faculties: Faculty[] = [];
  fieldofsearch: string[] = ["Agricultural Sciences", "Biological Sciences", "Chemical Sciences", "Computer and Information Sciences", "Sciences"];
  departmentsMap: { [index: number]: Department[] } = {};
  loadingFaculties = false;
  countryOptionsMap: { [index: number]: string[] } = {};
  countrySubs: { [index: number]: Subscription } = {};

  researchFields: any[] = [];
  filteredResearchFields: any[] = []
  showResearchFieldDropdown = false;
  publishers: Publisher[] = [];

  constructor(private fb: FormBuilder,
              private router: Router,
              private conferenceProceedingsService: ConferenceProceedingsService,
              private countryService: CountriesService,
              private researchFieldService: ResearchfieldService,
              private publisherService: PublisherService ) {


    this.researchFieldService.getAll().subscribe(data => {
      this.researchFields = data;
      this.filteredResearchFields = data;
    });
    this.publisherService.getAll().subscribe({
      next: (data) => {
        this.publishers = data;
      },
      error: (err) => {
        console.error('Failed to load publishers', err);
      }
    });

    this.loadFaculties(); // ✅ add this
    const proceedings = this.router.getCurrentNavigation()?.extras.state?.['proceedings'] as ConfrenceProceedings | undefined;

    this.form = this.fb.group({
      id: [proceedings?.id ?? null],
      duplicateProceedings: [false],

      /** Core DHET - Required Fields */
      dhetNo: [
        {value: proceedings?.dhetNo ?? '', disabled: true},
        [Validators.required, Validators.pattern(/^CP\d+/)]
      ],

      year: [proceedings?.yearOfPublication ?? '', Validators.required],
      title: [proceedings?.titleOfBook ?? '', Validators.required],
      editors: [proceedings?.editors ?? ''],
      publisher: [proceedings?.publisher ?? '', Validators.required],
      isbn: [
        proceedings?.isbn ?? '',
        [Validators.required, Validators.pattern(/^\d{4}-?\d{3}[\dX]$/i)]
      ],
      fieldofsearch: [proceedings?.fieldOfResearch ?? '', Validators.required],

      /** Publication Details - Required Fields */
      originalPhotocopy: [proceedings?.originalOrPhotocopy ?? '', Validators.required],
      peerReviewEvidence: [proceedings?.evidenceOfPeerReview ?? '', Validators.required],
      typeOfEvidence: [proceedings?.typeOfEvidence ?? '', Validators.required],

      /** Pages - Required Fields */
      totalNoPages: [proceedings?.totalNoPages ?? null, Validators.required],
      startPage: [proceedings?.startPage ?? null, Validators.required],
      endPage: [proceedings?.endPage ?? null, Validators.required],
      totalPagesClaimed: [proceedings?.totalPagesClaimed ?? null, Validators.required],

      /** Units - Required Fields */
      maxUnitsForPublication: [proceedings?.maxUnitsForPublication ?? 1],
      totalProportionOfAuthors: [proceedings?.totalProportionOfAuthors ?? 1, Validators.required],
      authorCount: [{value: proceedings?.authorCount ?? 1, disabled: true}, Validators.required],
      totalUnitsClaimed: [{value: proceedings?.totalUnitsClaimed ?? null, disabled: true}, Validators.required],

      /** Optional Fields */
      funders: [proceedings?.funders ?? ''],

      additionalComments: [proceedings?.additionalComments ?? ''],
      authors: this.fb.array(
        proceedings?.authors?.length
          ? proceedings.authors.map(a => this.newAuthor(a))
          : [this.newAuthor()]
      ),


    },{

      asyncValidators: [this.checkTitleIsbnUnique(this.conferenceProceedingsService)],
      updateOn: 'blur'

  }      );

    this.setupFieldSearch();
    this.setupAutoCalc();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
  }

  checkTitleIsbnUnique(conferenceProceedingsService: ConferenceProceedingsService) {
    return (group: AbstractControl) => {
      const title = group.get('title')?.value;
      const isbn = group.get('isbn')?.value;

      if (!title || !isbn) return of(null);

      return conferenceProceedingsService.exists(title, isbn).pipe(
        debounceTime(300),
        map((exists: boolean) => {
          return exists ? { duplicateProceedings: true } : null;
        })
      );
    };
  }


  setupFieldSearch() {
    this.form.get('fieldofsearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value =>
        this.researchFieldService.search(value || '')
      )
    ).subscribe(results => {
      this.filteredResearchFields = results;
    });
  }

  loadFaculties() {
    this.loadingFaculties = true;
    this.conferenceProceedingsService.getFaculties().subscribe({
      next: (data) => {
        this.faculties = data ?? [];
        this.loadingFaculties = false;
      },
      error: (err) => {
        console.error('Failed to load faculties', err);
        this.loadingFaculties = false;
      }
    });
  }

  // === Getters ===
  get authorsFA(): FormArray {
    return this.form.get('authors') as FormArray;
  }


  // === Builders ===
  newAuthor(a?: Authors): FormGroup {
    // Extract month and day from dob if it exists (format: YYYY-MM-DD)
    let dobMonth = '';
    let dobDay = '';
    if (a?.dob) {
      const parts = a.dob.split('-');
      if (parts.length >= 3) {
        dobMonth = parts[1];
        dobDay = parts[2];
      }
    }

    return this.fb.group({
      id: [a?.id ?? null],
      affiliation: true,
      studentEmployeeNo: [a?.studentEmployeeNo || '', Validators.required],
      firstName: [a?.firstName || '', Validators.required],
      surname: [a?.surname || '', Validators.required],
      initials: [a?.initials || ''],
      gender: [a?.gender ?? null as string | null, Validators.required],
      populationGroup: [a?.populationGroup || ''],
      dobMonth: [dobMonth || ''],
      dobDay: [dobDay || ''],
      email: [a?.email || '', [Validators.required, Validators.email]],
      facultyId: [a?.faculty ?? null, Validators.required],
      departmentId: [a?.department ?? null, Validators.required],
      orcid: [
        a?.orcid || '',
        [this.patternOptional(/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i)]
      ],
      countryOfBirth: [a?.countryOfBirth || ''],
      saResidencyStatus: [a?.saResidencyStatus || ''],
      disability: [a?.disability ?? false],

      highestQualification: [a?.highestQualification || ''],
      employmentStatus: [a?.employmentStatus || ''],
      department: [a?.department || ''],
      faculty: [a?.faculty || ''],
      academicTitle: [a?.academicTitle || ''],
    });
  }


  // === Utils ===
  patternOptional(rx: RegExp) {
    return (control: FormControl) => {
      const val = (control.value || '').trim();
      return !val || rx.test(val) ? null : {pattern: true};
    };
  }

  getDaysArray(): string[] {
    const days: string[] = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString().padStart(2, '0'));
    }
    return days;
  }

  addAuthor() {
    this.authorsFA.push(this.newAuthor());
    const i = this.authorsFA.length - 1;
    this.onCountrySearch(i);
    this.recalculateContributions();
  }

  removeAuthor(i: number) {
    this.authorsFA.removeAt(i);
    this.recalculateContributions();
  }

  // === Auto-calculation logic ===
  setupAutoCalc() {
    this.authorsFA.valueChanges.subscribe(() => this.recalculateContributions());
    this.form.get('maxUnitsForPublication')?.valueChanges.subscribe(() => this.recalculateContributions());
    this.form.get('totalProportionOfAuthors')?.valueChanges.subscribe(() => this.recalculateContributions());
    this.recalculateContributions();
  }

  recalculateContributions() {
    const maxUnits = this.form.get('maxUnitsForPublication')?.value || 0;
    const authorsCount = this.authorsFA.length || 1;

    // Update author count
    this.form.get('authorCount')?.setValue(authorsCount, {emitEvent: false});

    const totalProp = this.form.get('totalProportionOfAuthors')?.value || 1;
    const totalUnits = maxUnits * totalProp;

    // Update total units claimed
    this.form.get('totalUnitsClaimed')?.setValue(totalUnits, {emitEvent: false});
  }

  // === Payload / preview / submit ===
  buildPayload(): {
    id: any;
    dhetNo: any;
    year: any;
    title: any;
    duplicateProceedings: any;
    editors: any;
    publisher: any;
    isbn: any;
    fieldofsearch: any;
    originalPhotocopy: any;
    peerReviewEvidence: any;
    typeOfEvidence: any;
    totalNoPages: number | undefined;
    startPage: number | undefined;
    endPage: number | undefined;
    totalPagesClaimed: number | undefined;
    maxUnitsForPublication: number | undefined;
    totalProportionOfAuthors: number | undefined;
    authorCount: number | undefined;
    totalUnitsClaimed: number | undefined;
    funders: any;
    authors: Authors[];
    otherAuthorsNonAffiliates: any;
    additionalComments: any
  } {
    const raw = this.form.getRawValue();

    return {
      id: raw.id ?? null,
      dhetNo: raw.dhetNo,
      year: raw.year,
      title: raw.title,
      editors: raw.editors ?? '',
      publisher: raw.publisher,
      isbn: raw.isbn,
      fieldofsearch: raw.fieldofsearch ?? null,
      originalPhotocopy: raw.originalPhotocopy,
      peerReviewEvidence: raw.peerReviewEvidence,
      typeOfEvidence: raw.typeOfEvidence,
      totalNoPages: raw.totalNoPages ? Number(raw.totalNoPages) : undefined,
      startPage: raw.startPage ? Number(raw.startPage) : undefined,
      endPage: raw.endPage ? Number(raw.endPage) : undefined,
      totalPagesClaimed: raw.totalPagesClaimed ? Number(raw.totalPagesClaimed) : undefined,
      maxUnitsForPublication: raw.maxUnitsForPublication ? Number(raw.maxUnitsForPublication) : undefined,
      totalProportionOfAuthors: raw.totalProportionOfAuthors ? Number(raw.totalProportionOfAuthors) : undefined,
      authorCount: raw.authorCount ? Number(raw.authorCount) : undefined,
      totalUnitsClaimed: raw.totalUnitsClaimed ? Number(raw.totalUnitsClaimed) : undefined,
      funders: raw.funders ?? [],
      authors: raw.authors as Authors[],
      otherAuthorsNonAffiliates: raw.otherAuthorsNonAffiliates ?? [],
      additionalComments: raw.additionalComments ?? '',
      duplicateProceedings: raw.duplicateProceedings ?? false
    };
  }

  autoPopulateForm(): void {
    this.form.patchValue({
      id: null,
      dhetNo: 'CP0001',
      year: '2025',
      title: 'AI in Modern Conference Proceedings',
      editors: 'Dr. A. Smith',
      publisher: 'Springer',
      isbn: '978-3-030-12345',
      fieldofsearch: '1.02',
      originalPhotocopy: 'O',
      peerReviewEvidence: 'Yes',
      typeOfEvidence: 'Peer Reviewed',
      totalNoPages: 400,
      startPage: 150,
      endPage: 175,
      totalPagesClaimed: 26,
      maxUnitsForPublication: 2,
      totalProportionOfAuthors: 0.5,
      funders: 'NRF; University Grant',
      additionalComments: 'Sample data'
    });

    /** Reset and populate authors */
    this.authorsFA.clear();
    const authorsData: Authors[] = [
      {
        id: null,
        affiliation: true,
        studentEmployeeNo: 'EMP001',
        firstName: 'Muthu',
        surname: 'Ramavhunga',
        initials: 'MR',
        email: 'testing@univen.ac.za',
        gender: 'MALE',
        populationGroup: 'African',
        dob: '1994-01-23',
        faculty: 1,
        department: 1,
        orcid: '0000-0000-0000-0001',
        countryOfBirth: 'South Africa',
        saResidencyStatus: 'SOUTH_AFRICAN_CITIZEN',
        disability: false,
        highestQualification: 'MASTERS',
        employmentStatus: 'EMPLOYED_FULL_TIME',
        academicTitle: 'MR'
      }
    ];

    authorsData.forEach(a => {
      this.authorsFA.push(this.newAuthor(a));
    });

    this.recalculateContributions();
  }

  preview() {
    this.previewJson = JSON.stringify(this.buildPayload(), null, 2);
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();


    this.conferenceProceedingsService.save(payload).subscribe({
      next: _ => {

        Swal.fire({
          title: "Success",
          text: "Conference Proceedings saved successfully.",
          icon: "success"
        });
        this.router.navigate(['/conference-proceedings']);
      },
      error: err => {
        console.error('Error saving conference proceedings', err);
        Swal.fire({
          title: "Error",
          text: "Failed to save conference proceedings. Please try again.",
          icon: "error"
        });
      }
    });
  }

  onFacultyChange(authorIndex: number) {
    const facultyId = this.authorsFA.at(authorIndex).get('facultyId')?.value;
    if (!facultyId) return;

    this.conferenceProceedingsService.getDepartmentsByFaculty(facultyId).subscribe({
      next: (deps) => {

        this.departmentsMap[authorIndex] = deps;
        // reset department selection
        this.authorsFA.at(authorIndex).get('departmentId')?.reset();
      },
      error: (err) => {

        console.error(
          'Failed to load departments', err)
      }
    });

  }

  onCountrySearch(authorIndex: number) {
    const fg = this.authorsFA.at(authorIndex) as FormGroup;
    this.countrySubs[authorIndex]?.unsubscribe();
    fg.get('countryOfBirth')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => this.countryService.searchCountries(value))
    ).subscribe(list => {
      this.countryOptionsMap[authorIndex] = list;
    });
  }

  selectResearchField(field: any) {
    this.form.get('fieldofsearch')?.setValue(field.code); // or field.code
    this.filteredResearchFields = [];
    this.showResearchFieldDropdown = false;
  }


  reset() {
    this.form.reset();
    this.authorsFA.clear();
    this.authorsFA.push(this.newAuthor());
    this.recalculateContributions();
    this.showPreview = false;
    this.previewJson = '';
  }
}
