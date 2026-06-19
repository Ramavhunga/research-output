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
import {Books} from '../../models/Books';
import {
  Authors,
  Department, Faculty
} from '../../models/common.model';
import {BooksFieldsService} from '../../services/books-fields.service';
import {debounceTime, distinctUntilChanged, switchMap, Subscription, of, map} from 'rxjs';
import {CountriesService} from '../../services/countries.service';
import Swal from 'sweetalert2';
import {ResearchfieldService} from '../../services/researchfield.service';
import {Publisher, PublisherService} from '../../services/publisher.service';

@Component({
  selector: 'app-books-fields-detail-component',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './books-fields-detail-component.html',
  standalone: true,
  styleUrl: './books-fields-detail-component.css'
})
export class BooksFieldsDetailComponent {
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
              private booksFieldsService: BooksFieldsService,
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
    const book = this.router.getCurrentNavigation()?.extras.state?.['book'] as Books | undefined;

    this.form = this.fb.group({
      id: [book?.id ?? null],

      /** Core DHET - Required Fields */
      dhetNo: [
        {value: book?.dhetNo ?? '', disabled: true},
        [Validators.required, Validators.pattern(/^B\d+/)]
      ],

      year: [book?.yearOfPublication ?? '', Validators.required],
      title: [book?.titleOfBook ?? '', Validators.required],
      editors: [book?.editors ?? ''],
      publisher: [book?.publisher ?? '', Validators.required],
      isbn: [
        book?.isbn ?? '',
        [Validators.required]
      ],
      fieldofsearch: [book?.fieldOfResearch ?? '', Validators.required],

      /** Publication Details - Required Fields */
      originalPhotocopy: [book?.originalOrPhotocopy ?? '', Validators.required],
      peerReviewEvidence: [book?.evidenceOfPeerReview ?? '', Validators.required],
      typeOfEvidence: [book?.typeOfEvidence ?? '', Validators.required],

      /** Pages - Required Fields */
      totalNoPages: [book?.totalNoPages ?? null, Validators.required],
      startPage: [book?.startPage ?? null, Validators.required],
      endPage: [book?.endPage ?? null, Validators.required],
      totalPagesClaimed: [book?.totalPagesClaimed ?? null, Validators.required],

      /** Units - Required Fields */
      maxUnitsForPublication: [book?.maxUnitsForPublication ?? 1],
      totalProportionOfAuthors: [book?.totalProportionOfAuthors ?? 1, Validators.required],
      authorCount: [{value: book?.authorCount ?? 1, disabled: true}, Validators.required],
      otherAuthorsNonAffiliated: [{value: 0, disabled: true}],
      totalUnitsClaimed: [{value: book?.totalUnitsClaimed ?? null, disabled: true}, Validators.required],

      /** Optional Fields */
      funders: [book?.funders ?? ''],

      additionalComments: [book?.additionalComments ?? ''],
      authors: this.fb.array(
        book?.authors?.length
          ? book.authors.map(a => this.newAuthor(a))
          : [this.newAuthor()]
      ),


    },{

      asyncValidators: [this.checkTitleIsbnUnique(this.booksFieldsService)],
      updateOn: 'blur'

  }      );

    this.setupFieldSearch();
    this.setupAutoCalc();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
  }

  checkTitleIsbnUnique(booksFieldsService: BooksFieldsService) {
    return (group: AbstractControl) => {
      const title = group.get('title')?.value;
      const isbn = group.get('isbn')?.value;

      if (!title || !isbn) return of(null);

      return booksFieldsService.exists(title, isbn).pipe(
        debounceTime(300),
        map((exists: boolean) => {
          return exists ? { duplicateBook: true } : null;
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
    this.booksFieldsService.getFaculties().subscribe({
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

  // Calculate max units based on total pages claimed
  calculateMaxUnitsForPublication(pagesClaimed: number): number {
    if (pagesClaimed >= 300) return 10;
    if (pagesClaimed >= 270) return 9;
    if (pagesClaimed >= 240) return 8;
    if (pagesClaimed >= 210) return 7;
    if (pagesClaimed >= 180) return 6;
    if (pagesClaimed >= 150) return 5;
    if (pagesClaimed >= 120) return 4;
    if (pagesClaimed >= 90) return 3;
    if (pagesClaimed >= 60) return 2;
    return 0; // 0-59 pages
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
    // Listen to pages claimed changes and recalculate units
    this.form.get('totalPagesClaimed')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(pagesClaimed => {
      if (pagesClaimed) {
        const maxUnits = this.calculateMaxUnitsForPublication(Number(pagesClaimed));
        this.form.get('maxUnitsForPublication')?.setValue(maxUnits, { emitEvent: false });
        this.recalculateContributions();
      }
    });

    // Listen to author count changes
    this.authorsFA.valueChanges.subscribe(() => this.recalculateContributions());

    // Listen to total proportion changes
    this.form.get('totalProportionOfAuthors')?.valueChanges.subscribe(() => this.recalculateContributions());

    // Initial calculation
    this.recalculateContributions();
  }

  recalculateContributions() {
    // Get all authors
    const allAuthors = this.authorsFA.controls;
    // Affiliated authors: those with affiliation === true
    const affiliatedAuthors = allAuthors.filter(ctrl => ctrl.get('affiliation')?.value === true);
    const nonAffiliatedAuthors = allAuthors.filter(ctrl => ctrl.get('affiliation')?.value !== true);
    const affiliatedCount = affiliatedAuthors.length;
    const nonAffiliatedCount = nonAffiliatedAuthors.length;

    // Update author count (affiliated only)
    this.form.get('authorCount')?.setValue(affiliatedCount || 1, { emitEvent: false });
    // Update non-affiliated count
    this.form.get('otherAuthorsNonAffiliated')?.setValue(nonAffiliatedCount, { emitEvent: false });

    // Get current values
    const maxUnits = this.form.get('maxUnitsForPublication')?.value || 0;
    // Calculate total proportion of authors (user input)
    const userDefinedProportion = this.form.get('totalProportionOfAuthors')?.value || 1;

    // Calculate total units claimed = maxUnits × totalProportionOfAuthors (using only affiliated authors)
    // If there are no affiliated authors, treat as 1 for calculation to avoid division by zero
    const totalUnitsClaimed = maxUnits * userDefinedProportion;
    this.form.get('totalUnitsClaimed')?.setValue(totalUnitsClaimed, { emitEvent: false });
  }

  // === Payload / preview / submit ===
  buildPayload(): Books {
    const raw = this.form.getRawValue();

    // Convert publisher ID to publisher name
    const publisherName = this.getPublisherName(raw.publisher);

    return {
      id: raw.id ?? 0,
      dhetNo: raw.dhetNo,
      yearOfPublication: raw.year ? Number(raw.year) : 0,
      titleOfBook: raw.title,
      editors: raw.editors ?? undefined,
      publisher: raw.publisher,
      isbn: raw.isbn,
      fieldOfResearch: raw.fieldofsearch ?? null,
      originalOrPhotocopy: raw.originalPhotocopy,
      evidenceOfPeerReview: raw.peerReviewEvidence,
      typeOfEvidence: raw.typeOfEvidence ?? undefined,
      totalNoPages: raw.totalNoPages ? Number(raw.totalNoPages) : 0,
      startPage: raw.startPage ? Number(raw.startPage) : 0,
      endPage: raw.endPage ? Number(raw.endPage) : 0,
      totalPagesClaimed: raw.totalPagesClaimed ? Number(raw.totalPagesClaimed) : 0,
      maxUnitsForPublication: raw.maxUnitsForPublication ? Number(raw.maxUnitsForPublication) : undefined,
      totalProportionOfAuthors: raw.totalProportionOfAuthors ? Number(raw.totalProportionOfAuthors) : 0,
      authorCount: raw.authorCount ? Number(raw.authorCount) :0 ,
      totalUnitsClaimed: raw.totalUnitsClaimed ? Number(raw.totalUnitsClaimed) : 0,
       funders: raw.funders ?? undefined,
       authors: raw.authors as Authors[],
       additionalComments: raw.additionalComments ?? undefined
     };
   }

  private getPublisherName(publisherId: number | string): string {
    if (!publisherId) return '';
    const publisher = this.publishers.find(p => p.id === publisherId || p.id === Number(publisherId));
    return publisher?.name ?? '';
  }

  autoPopulateForm(): void {
    this.form.patchValue({
      id: null,
      dhetNo: 'B0001',
      year: '2025',
      title: 'Advanced Topics in Modern Research',
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
      totalPagesClaimed: 150,  // Updated to trigger 5 units calculation
      maxUnitsForPublication: 5,
     // totalProportionOfAuthors: 0.5,
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
    //  return;
    }

    const payload = this.buildPayload();


    this.booksFieldsService.save(payload).subscribe({
      next: _ => {

        Swal.fire({
          title: "Success",
          text: "Book saved successfully.",
          icon: "success"
        });
        this.router.navigate(['/books']);
      },
      error: err => {
        console.error('Error saving book', err);
        Swal.fire({
          title: "Success",
          text: "Book saved successfully.",
          icon: "success"
        });

        this.router.navigate(['/books']);
      }
    });
  }

  onFacultyChange(authorIndex: number) {
    const facultyId = this.authorsFA.at(authorIndex).get('facultyId')?.value;
    if (!facultyId) return;

    this.booksFieldsService.getDepartmentsByFaculty(facultyId).subscribe({
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

  hideResearchFieldDropdown() {
    setTimeout(() => {
      this.showResearchFieldDropdown = false;
    }, 200);
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
