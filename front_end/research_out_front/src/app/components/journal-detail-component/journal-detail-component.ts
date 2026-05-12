import { Component, OnInit } from '@angular/core';
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
  Units, Attachment
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
  templateUrl: './journal-detail-component.html',
  styleUrls: ['./journal-detail-component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class JournalDetailComponent implements OnInit {
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
  attachments: Attachment[] = [];
  fileErrors: string[] = [];
  newAttachmentDescription: string = '';
  fileError: string = '';
  selectedFile: File | null = null;
  currentStep = 1;
  totalSteps = 4;
  isSaving = false;
  saveMessage: string = '';
  showSaveMessage = false;
  lastSavedJournalId: number | null = null;
  steps = [
    { id: 1, label: 'Journal Information', name: 'journalinfo' },
    { id: 2, label: 'Affiliated Authors', name: 'affiliated' },
    { id: 3, label: 'Non-Affiliated Authors', name: 'nonaffiliated' },
    { id: 4, label: 'Results & Submissions', name: 'results' }
  ];

  // Unit calculation tracking
  unitBreakdown: {
    affiliatedAuthorsCount: number;
    nonAffiliatedAuthorsCount: number;
    authorSharePerAuthor: number;
    univenTotalClaimed: number;
    authorUnitCalculations: {
      authorIndex: number;
      authorName: string;
      authorShare: number;
      universityCount: number;
      hasResearchCompany: boolean;
      unitsPerUniversity: { [key: string]: number };
      univenClaim: number;
    }[];
  } = {
    affiliatedAuthorsCount: 0,
    nonAffiliatedAuthorsCount: 0,
    authorSharePerAuthor: 0,
    univenTotalClaimed: 0,
    authorUnitCalculations: []
  };

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
    // for async validation result
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
        otherAuthorsNonAffiliates: [journal?.units?.otherAuthorsNonAffiliates ?? null],
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

  ngOnInit() {
    // Load previously saved journal if available
    this.loadSavedJournal();
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
      // Show dropdown only if there are results and dropdown is open
      if (this.showResearchFieldDropdown && results.length === 0) {
        this.showResearchFieldDropdown = false;
      }
    });
  }

  /**
   * Open research field dropdown when input is focused
   */
  openResearchFieldDropdown() {
    this.showResearchFieldDropdown = true;
  }

  /**
   * Close research field dropdown when input loses focus
   */
  closeResearchFieldDropdown() {
    // Add a small delay to allow clicks on dropdown items to register
    setTimeout(() => {
      this.showResearchFieldDropdown = false;
      this.filteredResearchFields = [];
    }, 200);
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
  newAuthor(a?: Authors, affiliation: boolean = true): FormGroup {
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

    // Build university affiliations FormArray
    const univArray = this.fb.array(
      a?.universityAffiliations?.length
        ? a.universityAffiliations.map(u => this.fb.group({
            universityCode: [u.universityCode || '', Validators.required],
            universityName: [u.universityName || '', Validators.required],
            isUniven: [u.isUniven ?? false]
          }))
        : []
    );

    // Build research affiliations FormArray
    const researchArray = this.fb.array(
      a?.researchAffiliations?.length
        ? a.researchAffiliations.map(r => this.fb.group({
            companyName: [r.companyName || '', Validators.required],
            companyType: [r.companyType || 'OTHER', Validators.required]
          }))
        : []
    );

    return this.fb.group({
      id: [a?.id ?? null],
      affiliation: affiliation,
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

      // Unit calculation fields
      authorShare: [a?.authorShare ?? 0],
      totalUnitsClaimed: [a?.totalUnitsClaimed ?? 0],

      // Affiliation arrays
      universityAffiliations: univArray,
      researchAffiliations: researchArray
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

  addAuthor(affiliation: boolean = true) {
    this.authorsFA.push(this.newAuthor(undefined, affiliation));
    const i = this.authorsFA.length - 1;
    this.onCountrySearch(i);
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  removeAuthor(i: number) {
    this.authorsFA.removeAt(i);
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  // === Auto-calculation logic ===
  setupAutoCalc() {

    this.authorsFA.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
    });

    this.unitsFG?.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
    });

    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  recalculateContributions() {
    debugger;

    const unitsFG = this.unitsFG;
    if (!unitsFG) return;

    const maxUnits = unitsFG.get('maxUnitsForPublication')?.value || 0;

    // ✅ Separate affiliated vs non-affiliated
    const affiliatedAuthors = this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value === true
    );

    const nonAffiliatedAuthors = this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value !== true
    );

    const authorsCount = affiliatedAuthors.length || 1; // ✅ ONLY affiliated
    debugger;
    const otherAuthorsNonAffiliated = nonAffiliatedAuthors.length;

    // ✅ store both counts
    unitsFG.get('authorCount')?.setValue(authorsCount, { emitEvent: false });
    unitsFG.get('otherAuthorsNonAffiliates')?.setValue(otherAuthorsNonAffiliated, { emitEvent: false });

    const totalPropCtrl = unitsFG.get('totalProportionOfAuthors');
    const totalProp = totalPropCtrl?.value || 1;

    const totalUnits = maxUnits * totalProp;
    unitsFG.get('totalUnitsClaimed')?.setValue(totalUnits, { emitEvent: false });

    const proportion = 1 / authorsCount;

    // ✅ assign values
    this.authorsFA.controls.forEach(ctrl => {
      const fg = ctrl as FormGroup;
      const isAffiliated = fg.get('affiliation')?.value === true;

      if (isAffiliated) {
        fg.get('proportionOfAuthors')?.setValue(proportion, { emitEvent: false });
        fg.get('authorUnitsClaimed')?.setValue(maxUnits * proportion, { emitEvent: false });
      } else {
        // 🚫 Non-affiliated → NO calculation
        fg.get('proportionOfAuthors')?.setValue(null, { emitEvent: false });
        fg.get('authorUnitsClaimed')?.setValue(null, { emitEvent: false });
      }
    });

    // ✅ Claiming author (still based on affiliated count)
    this.claimingAuthorsContributionFG.get('proportionOfAuthors')
      ?.setValue(proportion, { emitEvent: false });

    this.claimingAuthorsContributionFG.get('authorUnitsClaimed')
      ?.setValue(maxUnits * proportion, { emitEvent: false });
  }

  // === Advanced Unit Calculation ===
  /**
   * Calculate units per author based on affiliations
   * Rules:
   * 1. Total units divided equally among ALL affiliated authors
   * 2. If author has multiple universities, split their share equally
   * 3. If UNIVEN + Research Company, give full share to UNIVEN
   * 4. Non-affiliated authors get no units
   */
  calculateAdvancedUnitBreakdown() {
    const maxUnits = this.unitsFG?.get('maxUnitsForPublication')?.value || 0;
    const totalProp = this.unitsFG?.get('totalProportionOfAuthors')?.value || 1;
    const totalUnits = maxUnits * totalProp;

    // Get affiliated authors
    const affiliatedAuthorsCtrl = this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value === true
    );

    const nonAffiliatedAuthorsCtrl = this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value !== true
    );

    const affiliatedAuthorsCount = affiliatedAuthorsCtrl.length || 1;
    const authorShare = totalUnits / affiliatedAuthorsCount; // Each affiliated author's share

    // Track calculations for display
    this.unitBreakdown = {
      affiliatedAuthorsCount,
      nonAffiliatedAuthorsCount: nonAffiliatedAuthorsCtrl.length,
      authorSharePerAuthor: authorShare,
      univenTotalClaimed: 0,
      authorUnitCalculations: []
    };

    // Calculate for each affiliated author
    affiliatedAuthorsCtrl.forEach((ctrl, idx) => {
      const fg = ctrl as FormGroup;
      const authorName = `${fg.get('firstName')?.value} ${fg.get('surname')?.value}`;

      // Get university and research affiliations
      const univAffiliations = (fg.get('universityAffiliations') as FormArray)?.getRawValue() || [];
      const researchAffiliations = (fg.get('researchAffiliations') as FormArray)?.getRawValue() || [];

      // Rule: UNIVEN + Research Company → full share to UNIVEN
      const hasUniven = univAffiliations.some((u: any) => u.isUniven);
      const hasResearchOnly = researchAffiliations.length > 0 && !hasUniven;

      let univenClaim = 0;
      let unitsPerUniversity: { [key: string]: number } = {};

      if (hasUniven && researchAffiliations.length > 0) {
        // UNIVEN + Research Company → full to UNIVEN
        univenClaim = authorShare;
        unitsPerUniversity['UNIVEN'] = authorShare;
      } else if (hasUniven) {
        // Multiple universities including UNIVEN
        const universityCount = univAffiliations.length;
        const unitPerUniv = authorShare / universityCount;
        univAffiliations.forEach((u: any) => {
          unitsPerUniversity[u.universityCode || u.universityName] = unitPerUniv;
          if (u.isUniven) univenClaim = unitPerUniv;
        });
      } else if (hasResearchOnly) {
        // Only research companies - no UNIVEN claim
        univenClaim = 0;
        researchAffiliations.forEach((r: any, i: number) => {
          unitsPerUniversity[r.companyName] = 0; // Research companies don't claim units
        });
      }

      this.unitBreakdown.univenTotalClaimed += univenClaim;

      // Store calculation
      this.unitBreakdown.authorUnitCalculations.push({
        authorIndex: idx,
        authorName,
        authorShare,
        universityCount: univAffiliations.length,
        hasResearchCompany: researchAffiliations.length > 0,
        unitsPerUniversity,
        univenClaim
      });

      // Update form values
      fg.patchValue({
        authorShare,
        totalUnitsClaimed: univenClaim
      }, { emitEvent: false });
    });

    // Zero out non-affiliated authors
    nonAffiliatedAuthorsCtrl.forEach(ctrl => {
      const fg = ctrl as FormGroup;
      fg.patchValue({
        authorShare: 0,
        totalUnitsClaimed: 0
      }, { emitEvent: false });
    });
  }

  /**
   * Get university affiliations for an author FormGroup
   */
  getUniversityAffiliations(authorFG: FormGroup): FormArray {
    return authorFG.get('universityAffiliations') as FormArray;
  }

  /**
   * Get research affiliations for an author FormGroup
   */
  getResearchAffiliations(authorFG: FormGroup): FormArray {
    return authorFG.get('researchAffiliations') as FormArray;
  }

  /**
   * Add a university affiliation to an author
   */
  addUniversityAffiliation(authorIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.push(this.fb.group({
      universityCode: ['', Validators.required],
      universityName: ['', Validators.required],
      isUniven: [false]
    }));
  }

  /**
   * Remove a university affiliation from an author
   */
  removeUniversityAffiliation(authorIndex: number, univIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.removeAt(univIndex);
    this.calculateAdvancedUnitBreakdown();
  }

  /**
   * Add a research affiliation to an author
   */
  addResearchAffiliation(authorIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.push(this.fb.group({
      companyName: ['', Validators.required],
      companyType: ['OTHER', Validators.required]
    }));
  }

  /**
   * Remove a research affiliation from an author
   */
  removeResearchAffiliation(authorIndex: number, resIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.removeAt(resIndex);
    this.calculateAdvancedUnitBreakdown();
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
    attachments: Attachment[];
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

      /** Attachments */
      attachments: this.attachments,

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
        totalProportionOfAuthors:1,
        authorsCount: 2,
       // totalUnitsClaimed: 0.5
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
        Swal.fire({
          title: "Success",
          text: "Journal saved successfully.",
          icon: "success"
        });
        this.router.navigate(['/journal']);
      //  alert('Failed to save journal. Please try again.');
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

  /**
   * Handle click on a research field dropdown item
   * Prevents blur event from firing immediately
   */
  selectResearchFieldOnClick(field: any) {
    this.selectResearchField(field);
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
    this.attachments = [];
    this.fileErrors = [];
    this.newAttachmentDescription = '';
    this.fileError = '';
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.type !== 'application/pdf') {
      this.fileError = 'Only PDF files are allowed.';
      this.selectedFile = null;
      return;
    }

    this.fileError = '';
    this.selectedFile = file;
  }

  addAttachment() {
    if (!this.selectedFile) {
      this.fileError = 'Please select a file.';
      return;
    }

    if (!this.newAttachmentDescription.trim()) {
      // Could add description error, but for now just proceed or alert
      Swal.fire({
        title: "Warning",
        text: "Description is recommended.",
        icon: "warning"
      });
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const attachment: Attachment = {
        fileName: this.selectedFile!.name,
        fileSize: this.selectedFile!.size,
        fileType: this.selectedFile!.type,
        file: this.selectedFile!,
        fileData: base64,
        description: this.newAttachmentDescription.trim() || 'No description'
      };
      this.attachments.push(attachment);

      // Reset form
      this.newAttachmentDescription = '';
      this.selectedFile = null;
      this.fileError = '';
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeAttachmentRow(index: number) {
    this.attachments.splice(index, 1);
  }

  viewAttachment(index: number) {
    const attachment = this.attachments[index];
    if (attachment.fileData) {
      const byteCharacters = atob(attachment.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  }

  // === Stepper Methods ===
  isStepValid(step: number): boolean {
    switch (step) {
      case 1: // Journal Information
        return this.isJournalInfoValid();
      case 2: // Affiliated Authors
        return this.isAuthorsValid(true);
      case 3: // Non-Affiliated Authors
        return this.isAuthorsValid(false);
      case 4: // Results & Submissions
        return this.form.valid;
      default:
        return false;
    }
  }

  isJournalInfoValid(): boolean {
    const fields = ['year', 'journalTitle', 'title', 'publisher', 'issn', 'fieldofsearch', 'index', 'comply'];
    return fields.every(field => {
      const control = this.form.get(field);
      return control && control.valid;
    });
  }

  isAuthorsValid(affiliated: boolean): boolean {
    const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
    if (affiliated && authors.length === 0) return false;
    return authors.every(ctrl => ctrl.valid);
  }

  goToNextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.isStepValid(this.currentStep)) {
        this.currentStep++;
        window.scrollTo(0, 0);
      } else {
        this.markStepAsTouched(this.currentStep);
        Swal.fire({
          title: "Incomplete Step",
          text: "Please fill in all required fields before proceeding.",
          icon: "warning"
        });
      }
    }
  }

  markStepAsTouched(step: number) {
    if (step === 1) {
      const fields = ['year', 'journalTitle', 'title', 'publisher', 'issn', 'fieldofsearch', 'index', 'comply'];
      fields.forEach(f => this.form.get(f)?.markAsTouched());
    } else if (step === 2 || step === 3) {
      const affiliated = (step === 2);
      const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
      authors.forEach(a => a.markAllAsTouched());
    } else {
      this.form.markAllAsTouched();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  goToStep(step: number) {
    if (step === this.currentStep) return;

    if (step < this.currentStep) {
      this.currentStep = step;
      window.scrollTo(0, 0);
      return;
    }

    // If moving forward, must validate intermediate steps
    for (let s = this.currentStep; s < step; s++) {
      if (!this.isStepValid(s)) {
        this.markStepAsTouched(s);
        Swal.fire({
          title: "Incomplete Step",
          text: `Please complete Step ${s} before moving to Step ${step}.`,
          icon: "warning"
        });
        return;
      }
    }
    this.currentStep = step;
    window.scrollTo(0, 0);
  }

  getAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value === true
    );
  }

  getNonAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value !== true
    );
  }

  /**
   * Save current step data
   */
  saveCurrentStep() {
    this.markStepAsTouched(this.currentStep);

    if (!this.isStepValid(this.currentStep)) {
      Swal.fire({
        title: "Incomplete Step",
        text: `Please complete all required fields in this step before saving.`,
        icon: "warning"
      });
      return;
    }

    this.isSaving = true;
    const payload = this.buildPayload();

    this.journalService.save(payload).subscribe({
      next: (savedJournal) => {
        this.isSaving = false;
        this.lastSavedJournalId = savedJournal.id;
        this.form.get('id')?.setValue(savedJournal.id, { emitEvent: false });

        this.saveMessage = `Step ${this.currentStep} saved successfully! You can continue editing later.`;
        this.showSaveMessage = true;

        setTimeout(() => {
          this.showSaveMessage = false;
        }, 3000);

        Swal.fire({
          title: "Saved",
          text: this.saveMessage,
          icon: "success",
          timer: 2000
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving step', err);
        Swal.fire({
          title: "Error",
          text: "Failed to save step. Please try again.",
          icon: "error"
        });
      }
    });
  }

  /**
   * Save current step and continue to next step
   */
  saveAndContinue() {
    this.markStepAsTouched(this.currentStep);

    if (!this.isStepValid(this.currentStep)) {
      Swal.fire({
        title: "Incomplete Step",
        text: `Please complete all required fields in this step before continuing.`,
        icon: "warning"
      });
      return;
    }

    this.isSaving = true;
    const payload = this.buildPayload();

    this.journalService.save(payload).subscribe({
      next: (savedJournal) => {
        this.isSaving = false;
        this.lastSavedJournalId = savedJournal.id;
        this.form.get('id')?.setValue(savedJournal.id, { emitEvent: false });

        this.saveMessage = `Step ${this.currentStep} saved successfully!`;
        this.showSaveMessage = true;

        // Move to next step
        if (this.currentStep < this.totalSteps) {
            setTimeout(() => {
            this.goToNextStep();
            this.showSaveMessage = false;
          }, 500);
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving step', err);
        Swal.fire({
          title: "Error",
          text: "Failed to save step. Please try again.",
          icon: "error"
        });
      }
    });
  }

  // duplicate simple nextStep removed; validated nextStep above is used

  /**
   * Load previously saved journal data
   */
  loadSavedJournal() {
    const journalIdFromState = this.router.getCurrentNavigation()?.extras.state?.['journal']?.id;

    if (journalIdFromState) {
      this.journalService.getById(journalIdFromState).subscribe({
        next: (journal) => {
          this.lastSavedJournalId = journal.id;
          this.populateFormWithJournal(journal);
        },
        error: (err) => {
          console.error('Error loading journal', err);
        }
      });
    }
  }

  /**
   * Populate form with journal data
   */
  private populateFormWithJournal(journal: Journal) {
    this.form.patchValue({
      id: journal.id,
      dhetNo: journal.dhetNo,
      year: journal.year,
      journalTitle: journal.journalTitle,
      title: journal.title,
      issn: journal.issn,
      publisher: journal.publisher,
      index: journal.index,
      comply: journal.comply,
      volume: journal.volume,
      issue: journal.issue,
      eissn: journal.eissn,
      doi: journal.doi,
      urls: journal.urls,
      openaccess: journal.openaccess,
      fieldofsearch: journal.fieldofsearch,
      publicationfeedescription: journal.publicationfeedescription,
      publishercurrency: journal.publishercurrency,
      totalPublicationFeePublisherCurrency: journal.totalPublicationFeePublisherCurrency,
      publicationfeearticle: journal.publicationfeearticle,
      authorsContributionFee: journal.authorsContributionFee,
      authorsContributionFeeZar: journal.authorsContributionFeeZar,
      funders: journal.funders
    });

    // Populate authors
    if (journal.authors && journal.authors.length > 0) {
      this.authorsFA.clear();
      journal.authors.forEach(author => {
        // ensure affiliation is a boolean (fallback to true when undefined/null)
        const affiliationFlag = (author.affiliation ?? true) as boolean;
        this.authorsFA.push(this.newAuthor(author, affiliationFlag));
      });
    }
  // Duplicate simple nextStep removed; using single validated nextStep implementation above
    }


}
