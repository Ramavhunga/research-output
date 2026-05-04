import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Journal } from '../../models/journal.model';
import {
  Authors,
  ClaimingAuthorsContribution, Department, Faculty,
  Units
} from '../../models/common.model';
import {JournalService} from '../../services/journal-service';
import {debounceTime, distinctUntilChanged, switchMap, Subscription, of, map} from 'rxjs';
import {CountriesService} from '../../services/countries.service';
import Swal from 'sweetalert2';
import {ResearchfieldService} from '../../services/researchfield.service';
import {Publisher, PublisherService} from '../../services/publisher.service';


// const DOI_REGEX = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i;
// const ISSN_REGEX = /^\d{4}-\d{3}[\dX]$/i;

@Component({
  selector: 'app-journal-detail-component',
  standalone: true,
  templateUrl: './journal-detail-component.html',
  styleUrl: './journal-detail-component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class JournalDetailComponent {
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
              private journalService: JournalService,
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
    const journal = this.router.getCurrentNavigation()?.extras.state?.['journal'] as Journal | undefined;
    debugger;
    this.form = this.fb.group({
      id: [journal?.id ?? null],
      duplicateJournal: [false], // for async validation result
      /** Core DHET */
      dhetNo: [
        {value: journal?.dhetNo ?? '', disabled: true},
        [Validators.required, Validators.pattern(/^J\d+/)]
      ],

      year: [journal?.year ?? '', Validators.required],
      journalTitle: [journal?.journalTitle ?? '', Validators.required],
      title: [journal?.title ?? '', Validators.required],
      issn: [
        journal?.issn ?? '',
        [Validators.required, Validators.pattern(/^\d{4}-?\d{3}[\dX]$/i)]
      ],
      publisher: [journal?.publisher ?? '', Validators.required],
      index: [journal?.index ?? '', Validators.required],
      comply: [journal?.comply ?? null, Validators.required],

      /** Publication */
      volume: [journal?.volume ?? null],
      issue: [journal?.issue ?? null],



      eissn: [journal?.eissn ?? null],

      doi: [
        journal?.doi ?? null,
        this.patternOptional(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i)
      ],

      urls: [journal?.urls ?? null],

      openaccess: [journal?.openaccess ?? null],

      /** Research */
      fieldofsearch: [journal?.fieldofsearch ?? '', Validators.required],

      /** Fees */
      publicationfeedescription: [journal?.publicationfeedescription ?? null],
      publishercurrency: [journal?.publishercurrency ?? null],
      totalPublicationFeePublisherCurrency: [journal?.totalPublicationFeePublisherCurrency ?? null],
      publicationfeearticle: [journal?.publicationfeearticle ?? null],
      authorsContributionFee: [journal?.authorsContributionFee ?? null],
      authorsContributionFeeZar: [journal?.authorsContributionFeeZar ?? null],

      funders: [journal?.funders ?? ''],

      /** Units (FIXED STRUCTURE) */
      units: this.fb.group({
        maxUnitsForPublication: [journal?.units?.maxUnitsForPublication ?? 1],
        totalProportionOfAuthors: [journal?.units?.totalProportionOfAuthors ?? 1],
        authorCount: [journal?.units?.authorsCount ?? 1],
        totalUnitsClaimed: [journal?.units?.totalUnitsClaimed ?? null],
      }),

      /** Authors */
      authors: this.fb.array(
        journal?.authors?.length
          ? journal.authors.map(a => this.newAuthor(a))
          : [this.newAuthor()]
      ),

      otherAuthorsNonAffiliated: [
        journal?.otherAuthorsNonAffiliated?.join('; ') ?? ''
      ],

      /** Contribution */
      claimingAuthorsContribution: this.fb.group({
        proportionOfAuthors: [journal?.claimingAuthorsContribution?.proportionOfAuthors ?? null],
        authorUnitsClaimed: [journal?.claimingAuthorsContribution?.authorUnitsClaimed ?? null],
        additionalComments: [journal?.claimingAuthorsContribution?.additionalComments ?? '']
      }),

      additionalComments: [journal?.additionalComments ?? '']

    },{

      asyncValidators: [this.checkTitleIssnUnique(this.journalService)],
      updateOn: 'blur' // ✅ VERY IMPORTANT



  }      );

    this.setupFieldSearch();
    this.setupAutoCalc();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
  }

  checkTitleIssnUnique(journalService: JournalService) {
    return (group: AbstractControl) => {
      const title = group.get('title')?.value;
      const issn = group.get('issn')?.value;

      if (!title || !issn) return of(null);

      return journalService.exists(title, issn).pipe(
        debounceTime(300),
        map((exists: boolean) => {
          debugger;
          return exists ? { duplicateJournal: true } : null;
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
    this.journalService.getFaculties().subscribe({
      next: (data) => {
        debugger;
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

  get unitsFG(): FormGroup {
    return this.form.get('units') as FormGroup;
  }


  get claimingAuthorsContributionFG(): FormGroup {
    return this.form.get('claimingAuthorsContribution') as FormGroup;
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

    this.unitsFG?.valueChanges.subscribe(() => this.recalculateContributions());

    this.recalculateContributions();
  }

  recalculateContributions() {
    debugger;
    const unitsFG = this.unitsFG;
    if (!unitsFG) return;

    const maxUnits = unitsFG.get('maxUnitsForPublication')?.value || 0;
    const authorsCount = this.authorsFA.length || 1;

    unitsFG.get('authorCount')?.setValue(authorsCount, {emitEvent: false});

    const totalPropCtrl = unitsFG.get('totalProportionOfAuthors');
    const totalProp = totalPropCtrl?.value || 1;

    const totalUnits = maxUnits * totalProp;
    unitsFG.get('totalUnitsClaimed')?.setValue(totalUnits, {emitEvent: false});

    const proportion = 1 / authorsCount;

    this.authorsFA.controls.forEach(ctrl => {
      const fg = ctrl as FormGroup;
      fg.get('proportionOfAuthors')?.setValue(proportion, {emitEvent: false});
      fg.get('authorUnitsClaimed')?.setValue(maxUnits * proportion, {emitEvent: false});
    });

    this.claimingAuthorsContributionFG.get('proportionOfAuthors')
      ?.setValue(proportion, {emitEvent: false});
    this.claimingAuthorsContributionFG.get('authorUnitsClaimed')
      ?.setValue(maxUnits * proportion, {emitEvent: false});

  }

  // === Payload / preview / submit ===
  buildPayload(): {
    id: any;
    dhetNo: any;
    year: any;
    title: any;
    duplicateJournal:any;
    journalTitle: any;
    publisher: any;
    index: any;
    comply: boolean;
    volume: any;
    issue: any;
    issn: any;
    eissn: any;
    doi: any;
    urls: any;
    openaccess: any;
    fieldofsearch: any;
    publicationfeedescription: any;
    publishercurrency: any;
    totalPublicationFeePublisherCurrency: number | undefined;
    publicationfeearticle: number | undefined;
    authorsContributionFee: number | undefined;
    authorsContributionFeeZar: number | undefined;
    funders: any;
    maxUnitsForPublication: number | undefined;
    totalProportionOfAuthors: number | undefined;
    authorCount: number | undefined;
    totalUnitsClaimed: number | undefined;
    authors: Authors[];
    otherAuthorsNonAffiliated: any;
    units: Units;
    claimingAuthorsContribution: ClaimingAuthorsContribution;
    additionalComments: any
  } {
    const raw = this.form.getRawValue();

    return {
      id: raw.id ?? null,

      /** Core DHET Info */
      dhetNo: raw.dhetNo,
      year: raw.year,
      title: raw.title,
      journalTitle: raw.journalTitle ?? '',
      duplicateJournal:raw.duplicateJournal ?? false,
      publisher: raw.publisher,
      index: raw.index,
      comply: !!raw.comply,

      /** Publication Details */
      volume: raw.volume ?? null,
      issue: raw.issue ?? null,
      issn: raw.issn,
      eissn: raw.eissn ?? null,
      doi: raw.doi ?? null,

      // convert URL string to array if needed
      urls: raw.urls ?? null,


      openaccess: raw.openaccess ?? false,

      /** Research */
      fieldofsearch: raw.fieldofsearch ?? null,

      /** Fees & Funding */
      publicationfeedescription: raw.publicationfeedescription ?? '',
      publishercurrency: raw.publishercurrency ?? '',
      totalPublicationFeePublisherCurrency:
        raw.totalPublicationFeePublisherCurrency
          ? Number(raw.totalPublicationFeePublisherCurrency)
          : undefined,

      publicationfeearticle: raw.publicationfeearticle
        ? Number(raw.publicationfeearticle)
        : undefined,

      authorsContributionFee: raw.authorsContributionFee
        ? Number(raw.authorsContributionFee)
        : undefined,

      authorsContributionFeeZar: raw.authorsContributionFeeZar
        ? Number(raw.authorsContributionFeeZar)
        : undefined,

      funders: raw.funders ?? [],

      /** DHET Units */
      maxUnitsForPublication: raw.maxUnitsForPublication
        ? Number(raw.maxUnitsForPublication)
        : undefined,

      totalProportionOfAuthors: raw.totalProportionOfAuthors
        ? Number(raw.totalProportionOfAuthors)
        : undefined,

      authorCount: raw.authorCount
        ? Number(raw.authorCount)
        : undefined,

      totalUnitsClaimed: raw.totalUnitsClaimed
        ? Number(raw.totalUnitsClaimed)
        : undefined,

      /** Authors */
      authors: raw.authors as Authors[],
      otherAuthorsNonAffiliated: raw.otherAuthorsNonAffiliated ?? [],

      /** Units & Contributions */
      units: raw.units as Units,
      claimingAuthorsContribution:
        raw.claimingAuthorsContribution as ClaimingAuthorsContribution,

      /** Notes */
      additionalComments: raw.additionalComments ?? ''
    };
  }

  autoPopulateForm(): void {

    /** 1. Patch normal fields */
    this.form.patchValue({
      id: null,
      dhetNo: 'J0001',
      year: '2025',
      title: 'AI in Modern Enterprise Systems',
      journalTitle: 'International Journal of Computer Science',
      publisher: 1,
      index: 'Scopus',
      comply: true,
      duplicateJournal:false,
      volume: 12,
      issue: 3,
      issn: '1234-5678',
      eissn: '8765-4321',
      doi: '10.1000/xyz123',
      urls: 'https://example.com/article',
      openaccess: true,

      fieldofsearch: 1.02,

      publicationfeedescription: 'Article Processing Charge',
      publishercurrency: 'USD',
      totalPublicationFeePublisherCurrency: 1500,
      publicationfeearticle: 1500,
      authorsContributionFee: 500,
      authorsContributionFeeZar: 9500,

      funders: 'NRF; University Grant',

      units: {
        maxUnitsForPublication: 1,
        totalProportionOfAuthors: 0.5,
        authorsCount: 2,
        totalUnitsClaimed: 0.5
      },

      claimingAuthorsContribution: {
        proportionOfAuthors: 0.5,
        authorUnitsClaimed: 0.5,
        additionalComments: 'Auto populated'
      },

      additionalComments: 'Auto-populated sample data'
    });

    /** 2. FIX: Reset and populate authors properly */
    this.authorsFA.clear();

    const authorsData: Authors[] = [
      {
        id: null,
        affiliation: true,
        studentEmployeeNo: 'EMP001',
        firstName: 'Muthu',
        surname: 'Ramavhunga',
        initials: 'MR',
        email:'testing@univen.ac.za',
        gender: 'MALE',
        populationGroup: 'African',
        dob: '1994-01-23',
        faculty: 1,
        department: 1,
        // facultyId: this.faculties?.[0]?.id ?? null,
        // departmentId: null,
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

    /** 3. Recalculate after populate */
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
    debugger;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      //  return;
    }

    const payload = this.buildPayload();


    this.journalService.save(payload).subscribe({
      next: _ => {

        Swal.fire({
          title: "Success",
          text: "Journal saved successfully.",
          icon: "success"
        });
        //  alert('Journal saved successfully.');
        this.router.navigate(['/journal']);
      },
      error: err => {
        console.error('Error saving journal', err);
        alert('Failed to save journal. Please try again.');
      }
    });
  }

  onFacultyChange(authorIndex: number) {
    debugger;
    const facultyId = this.authorsFA.at(authorIndex).get('facultyId')?.value;
    if (!facultyId) return;

    this.journalService.getDepartmentsByFaculty(facultyId).subscribe({
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
    debugger
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
    this.unitsFG.reset({
      maxUnitsForPublication: null,
      totalProportionOfAuthors: 1,
      authorsCount: 1,
      totalUnitsClaimed: null,
      otherAuthorsNonAffiliates: '',
      additionalComments: '',
    });
    this.recalculateContributions();
    this.showPreview = false;
    this.previewJson = '';
  }
}


