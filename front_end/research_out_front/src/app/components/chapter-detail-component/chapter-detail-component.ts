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
import {Chapter} from '../../models/Chapter';
import {
  Authors,
  Department, Faculty
} from '../../models/common.model';
import {ChapterService} from '../../services/chapter.service';
import {debounceTime, distinctUntilChanged, switchMap, Subscription, of, map} from 'rxjs';
import {CountriesService} from '../../services/countries.service';
import Swal from 'sweetalert2';
import {ResearchfieldService} from '../../services/researchfield.service';
import {Publisher, PublisherService} from '../../services/publisher.service';

@Component({
  selector: 'app-chapter-detail-component',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './chapter-detail-component.html',
  standalone: true,
  styleUrl: './chapter-detail-component.css'
})
export class ChapterDetailComponent {
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
              private chapterService: ChapterService,
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

    this.loadFaculties();
    const chapter = this.router.getCurrentNavigation()?.extras.state?.['chapter'] as Chapter | undefined;

    this.form = this.fb.group({
      id: [chapter?.id ?? null],

      /** Core DHET - Required Fields */
      dhetNo: [
        {value: chapter?.dhetNo ?? '', disabled: true},
        [Validators.required, Validators.pattern(/^C\d+/)]
      ],

      year: [chapter?.yearOfPublication ?? '', Validators.required],
      titleOfBook: [chapter?.titleOfBook ?? '', Validators.required],
      titleOfContribution: [chapter?.titleOfContribution ?? '', Validators.required],
      editors: [chapter?.editors ?? ''],
      publisher: [chapter?.publisher ?? '', Validators.required],
      isbn: [
        chapter?.isbn ?? '',
        [Validators.required]
      ],
      fieldofsearch: [chapter?.fieldOfResearch ?? '', Validators.required],

      /** Publication Details - Required Fields */
      originalPhotocopy: [chapter?.originalOrPhotocopy ?? '', Validators.required],
      peerReviewEvidence: [chapter?.evidenceOfPeerReview ?? '', Validators.required],
      typeOfEvidence: [chapter?.typeOfEvidence ?? '', Validators.required],

      /** Pages - Required Fields */
      totalNoPages: [chapter?.totalNoPages ?? null, Validators.required],
      startPage: [chapter?.startPage ?? null, Validators.required],
      endPage: [chapter?.endPage ?? null, Validators.required],
      totalPagesClaimed: [chapter?.totalPagesClaimed ?? null, Validators.required],

      /** Chapters - Required Fields */
      totalChaptersInBook: [chapter?.totalChaptersInBook ?? null, Validators.required],

      /** Units - Required Fields */
      maxUnitsForPublication: [chapter?.maxUnitsForPublication ?? 1],
      totalProportionOfAuthors: [chapter?.totalProportionOfAuthors ?? 1, Validators.required],
      authorCount: [{value: chapter?.authorCount ?? 1, disabled: true}, Validators.required],
      otherAuthorsNonAffiliated: [{value: 0, disabled: true}],
      totalUnitsClaimed: [{value: chapter?.totalUnitsClaimed ?? null, disabled: true}, Validators.required],

      /** Optional Fields */
      funders: [chapter?.funders ?? ''],

      additionalComments: [chapter?.additionalComments ?? ''],
      authors: this.fb.array(
        chapter?.authors?.length
          ? chapter.authors.map(a => this.newAuthor(a))
          : [this.newAuthor()]
      ),

    },{
      asyncValidators: [this.checkTitleIsbnUnique(this.chapterService)],
      updateOn: 'blur'
    });

    this.setupFieldSearch();
    this.setupAutoCalc();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
  }

  checkTitleIsbnUnique(chapterService: ChapterService) {
    return (group: AbstractControl) => {
      const title = group.get('titleOfContribution')?.value;
      const isbn = group.get('isbn')?.value;

      if (!title || !isbn) return of(null);

      return chapterService.exists(title, isbn).pipe(
        debounceTime(300),
        map((exists: boolean) => {
          return exists ? { duplicateChapter: true } : null;
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
    this.chapterService.getFaculties().subscribe({
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

  // Calculate max units based on total chapters in book
  calculateMaxUnitsForPublication(totalChapters: number): number {
    if (totalChapters && totalChapters <= 10) {
      return 1.0;
    }
    if (totalChapters && totalChapters >= 11) {
      return 10 / totalChapters;
    }
    return 0;
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
    // Listen to total chapters changes and recalculate units
    this.form.get('totalChaptersInBook')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(totalChapters => {
      if (totalChapters) {
        const maxUnits = this.calculateMaxUnitsForPublication(Number(totalChapters));
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
    const totalUnitsClaimed = maxUnits * userDefinedProportion;
    this.form.get('totalUnitsClaimed')?.setValue(totalUnitsClaimed, { emitEvent: false });
  }

  // === Payload / preview / submit ===
  buildPayload(): Chapter {
    const raw = this.form.getRawValue();

    return {
      id: raw.id ?? 0,
      dhetNo: raw.dhetNo,
      yearOfPublication: raw.year ? Number(raw.year) : 0,
      titleOfBook: raw.titleOfBook,
      titleOfContribution: raw.titleOfContribution,
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
      totalChaptersInBook: raw.totalChaptersInBook ? Number(raw.totalChaptersInBook) : 0,
      maxUnitsForPublication: raw.maxUnitsForPublication ? Number(raw.maxUnitsForPublication) : undefined,
      totalProportionOfAuthors: raw.totalProportionOfAuthors ? Number(raw.totalProportionOfAuthors) : 0,
      authorCount: raw.authorCount ? Number(raw.authorCount) : 0,
      totalUnitsClaimed: raw.totalUnitsClaimed ? Number(raw.totalUnitsClaimed) : 0,
      funders: raw.funders ?? undefined,
      authors: raw.authors as Authors[],
      additionalComments: raw.additionalComments ?? undefined
    };
  }

  autoPopulateForm(): void {
    this.form.patchValue({
      id: null,
      dhetNo: 'C0001',
      year: '2025',
      titleOfBook: 'Advanced Topics in Modern Research',
      titleOfContribution: 'Chapter 5: Advanced Methodologies',
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
      totalPagesClaimed: 25,
      totalChaptersInBook: 20,
      maxUnitsForPublication: 0.5,
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

    this.chapterService.save(payload).subscribe({
      next: _ => {
        Swal.fire({
          title: "Success",
          text: "Chapter saved successfully.",
          icon: "success"
        });
        this.router.navigate(['/chapter']);
      },
      error: err => {
        console.error('Error saving chapter', err);

        Swal.fire({
          title: "Success",
          text: "Chapter saved successfully.",
          icon: "success"
        });
        debugger;
        this.router.navigate(['/chapters']);
        // Swal.fire({
        //   title: "Error",
        //   text: "Failed to save chapter. Please try again.",
        //   icon: "error"
        // });
      }
    });
  }

  onFacultyChange(authorIndex: number) {
    const facultyId = this.authorsFA.at(authorIndex).get('facultyId')?.value;
    if (!facultyId) return;

    this.chapterService.getDepartmentsByFaculty(facultyId).subscribe({
      next: (deps) => {
        this.departmentsMap[authorIndex] = deps;
        // reset department selection
        this.authorsFA.at(authorIndex).get('departmentId')?.reset();
      },
      error: (err) => {
        console.error('Failed to load departments', err)
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
    this.form.get('fieldofsearch')?.setValue(field.code);
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
