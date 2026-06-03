import { ChangeDetectorRef, Component } from '@angular/core';
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
import {ConferenceProceedings} from '../../models/ConfrenceProceedings';

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
  currentStep = 1;
  totalSteps = 4;
  steps = [
    { id: 1, label: 'Conference Information' },
    { id: 2, label: 'Affiliated Authors' },
    { id: 3, label: 'Non-Affiliated Authors' },
    { id: 4, label: 'Results & Submission' }
  ];
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
  unitBreakdown: {
    totalAuthorsCount: number;
    affiliatedAuthorsCount: number;
    nonAffiliatedAuthorsCount: number;
    authorSharePerAuthor: number;
    univenTotalClaimed: number;
    authorUnitCalculations: {
      authorIndex: number;
      authorName: string;
      isAffiliated: boolean;
      authorShare: number;
      universityCount: number;
      researchAffiliationsCount: number;
      splitDetails: {
        label: string;
        type: string;
        units: number;
        claimedByUniven: boolean;
      }[];
      ruleApplied: string;
      univenClaim: number;
    }[];
  } = {
    totalAuthorsCount: 0,
    affiliatedAuthorsCount: 0,
    nonAffiliatedAuthorsCount: 0,
    authorSharePerAuthor: 0,
    univenTotalClaimed: 0,
    authorUnitCalculations: []
  };

  constructor(private fb: FormBuilder,
              private router: Router,
              private conferenceProceedingsService: ConferenceProceedingsService,
              private countryService: CountriesService,
              private researchFieldService: ResearchfieldService,
              private publisherService: PublisherService,
              private cdr: ChangeDetectorRef ) {


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
    const proceedings = this.router.getCurrentNavigation()?.extras.state?.['proceedings'] as ConferenceProceedings | undefined;


    this.form = this.fb.group({
      id: [proceedings?.id ?? null],
      dhetNo: [
        {value: proceedings?.dhetNo ?? '', disabled: true},
        [Validators.required, Validators.pattern(/^CP\d+/)]
      ],
      year: [proceedings?.yearOfPublication ?? '', Validators.required],
      titleOfConferenceProceedings: [proceedings?.titleOfConferenceProceedings ?? '', Validators.required],
      titleOfContribution: [proceedings?.titleOfContribution ?? '', Validators.required],
      totalChaptersInBook: [null],
      editors: [proceedings?.editors ?? ''],
      publisher: [proceedings?.publisher ?? '', Validators.required],
      isbn: [
        proceedings?.isbn ?? '',
        [Validators.required]
      ],
      fieldofsearch: [proceedings?.fieldOfResearch ?? '', Validators.required],
      originalPhotocopy: [proceedings?.originalOrPhotocopy ?? '', Validators.required],
      peerReviewEvidence: [proceedings?.evidenceOfPeerReview ?? '', Validators.required],
      typeOfEvidence: [proceedings?.typeOfEvidence ?? '', Validators.required],
      totalNoPages: [proceedings?.totalNoPages ?? null, Validators.required],
      startPage: [proceedings?.startPage ?? null, Validators.required],
      endPage: [proceedings?.endPage ?? null, Validators.required],
      totalPagesClaimed: [proceedings?.totalPagesClaimed ?? null, Validators.required],
      maxUnitsForPublication: [proceedings?.maxUnitsForPublication ?? 1],
      totalProportionOfAuthors: [proceedings?.totalProportionOfAuthors ?? 1, Validators.required],
      authorCount: [{value: proceedings?.authorCount ?? 1, disabled: true}, Validators.required],
      otherAuthorsNonAffiliated: [{value: 0, disabled: true}],
      totalUnitsClaimed: [{value: proceedings?.totalUnitsClaimed ?? null, disabled: true}, Validators.required],
      funders: [proceedings?.funders ?? ''],
      additionalComments: [proceedings?.additionalComments ?? ''],
      compliesWith60Rule: [proceedings?.compliesWith60Rule ?? false],
      startDate: [proceedings?.startDate ?? '', Validators.required],
      endDate: [proceedings?.endDate ?? '', Validators.required],
      city: [proceedings?.city ?? '', Validators.required],
      country: [proceedings?.country ?? '', Validators.required],
      authors: this.fb.array(
        proceedings?.authors?.length
          ? proceedings.authors.map(a => this.newAuthor(a, this.asBoolean(a.affiliation, true)))
          : [this.newAuthor()]
      ),
    },{
      asyncValidators: [this.checkTitleIsbnUnique(this.conferenceProceedingsService)],
      updateOn: 'blur'
    });

    this.setupFieldSearch();
    this.setupAutoCalc();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
    this.authorsFA.controls.forEach(ctrl => this.initAuthorAffiliationHandling(ctrl as FormGroup));
  }

  private asBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    if (typeof value === 'number') return value === 1;
    return fallback;
  }

  checkTitleIsbnUnique(conferenceProceedingsService: ConferenceProceedingsService) {
    return (group: AbstractControl) => {
      const title = group.get('titleOfConferenceProceedings')?.value;
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
  newAuthor(a?: Authors, affiliation = true): FormGroup {
    const resolvedAffiliation = this.asBoolean(a?.affiliation, affiliation);

    const univArray = this.fb.array(
      a?.universityAffiliations?.length
        ? a.universityAffiliations.map(u => this.fb.group({
          universityCode: [u.universityCode || '', Validators.required],
          universityName: [u.universityName || '', Validators.required],
          isUniven: [u.isUniven ?? false],
          isInternationalUniversity: [u.isInternationalUniversity ?? false]
        }))
        : []
    );

    const researchArray = this.fb.array(
      a?.researchAffiliations?.length
        ? a.researchAffiliations.map(r => this.fb.group({
          companyName: [r.companyName || '', Validators.required],
          companyType: [r.companyType || 'OTHER', Validators.required]
        }))
        : []
    );

    const authorFG = this.fb.group({
      id: [a?.id ?? null],
      affiliation: [resolvedAffiliation],
      studentEmployeeNo: [a?.studentEmployeeNo || null],
      firstName: [a?.firstName || '', Validators.required],
      surname: [a?.surname || '', Validators.required],
      initials: [a?.initials || ''],
      gender: [a?.gender ?? null as string | null],
      populationGroup: [a?.populationGroup || ''],
      dob: [a?.dob || null],
      email: [a?.email || '', [Validators.required, Validators.email]],
      facultyId: [a?.faculty ?? null],
      departmentId: [a?.department ?? null],
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
      proportionOfAuthors: [null],
      authorUnitsClaimed: [null],
      authorShare: [a?.authorShare ?? 0],
      totalUnitsClaimed: [a?.totalUnitsClaimed ?? 0],
      universityAffiliations: univArray,
      researchAffiliations: researchArray
    });

    this.updateAffiliatedValidators(authorFG, resolvedAffiliation);
    return authorFG;
  }

  updateAffiliatedValidators(authorFG: FormGroup, isAffiliated: boolean) {
    const requiredFieldsForAffiliated = ['studentEmployeeNo', 'gender', 'facultyId'];
    requiredFieldsForAffiliated.forEach(field => {
      const ctrl = authorFG.get(field);
      if (!ctrl) return;

      if (isAffiliated) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private initAuthorAffiliationHandling(authorFG: FormGroup) {
    authorFG.get('affiliation')?.valueChanges.subscribe((value) => {
      const isAffiliated = this.asBoolean(value, false);
      this.updateAffiliatedValidators(authorFG, isAffiliated);
      this.recalculateContributions();
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

  addAuthor(affiliation = true) {
    const newAuthorFG = this.newAuthor(undefined, affiliation);
    this.authorsFA.push(newAuthorFG);
    this.initAuthorAffiliationHandling(newAuthorFG);
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
      this.cdr.markForCheck();
    });

    this.form.get('totalProportionOfAuthors')?.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
      this.cdr.markForCheck();
    });
    this.form.get('maxUnitsForPublication')?.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
      this.cdr.markForCheck();
    });

    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  recalculateContributions() {
    const allAuthors = this.authorsFA.controls;
    const nonAffiliatedAuthors = allAuthors.filter(ctrl => !this.asBoolean(ctrl.get('affiliation')?.value, false));
    const totalAuthorCount = allAuthors.length;
    const nonAffiliatedCount = nonAffiliatedAuthors.length;

    this.form.get('authorCount')?.setValue(totalAuthorCount || 1, { emitEvent: false });
    this.form.get('otherAuthorsNonAffiliated')?.setValue(nonAffiliatedCount, { emitEvent: false });

    const maxUnits = Number(this.form.get('maxUnitsForPublication')?.value ?? 1) || 1;
    const userDefinedProportion = this.form.get('totalProportionOfAuthors')?.value || 1;

    const totalUnitsClaimed = maxUnits * userDefinedProportion;
    this.form.get('totalUnitsClaimed')?.setValue(totalUnitsClaimed, { emitEvent: false });

    const divisor = totalAuthorCount > 0 ? totalAuthorCount : 1;
    const proportion = totalAuthorCount > 0 ? (1 / divisor) : 0;
    allAuthors.forEach(ctrl => {
      const isAffiliated = this.asBoolean(ctrl.get('affiliation')?.value, false);
      const authorShare = totalUnitsClaimed * proportion;
      if (isAffiliated) {
        ctrl.get('proportionOfAuthors')?.setValue(proportion, { emitEvent: false });
        ctrl.get('authorUnitsClaimed')?.setValue(authorShare, { emitEvent: false });
        ctrl.get('authorShare')?.setValue(authorShare, { emitEvent: false });
      } else {
        ctrl.get('proportionOfAuthors')?.setValue(null, { emitEvent: false });
        ctrl.get('authorUnitsClaimed')?.setValue(null, { emitEvent: false });
        ctrl.get('authorShare')?.setValue(0, { emitEvent: false });
      }
    });
  }

  calculateAdvancedUnitBreakdown() {
    const maxUnits = Number(this.form.get('maxUnitsForPublication')?.value ?? 1) || 1;
    const totalProp = Number(this.form.get('totalProportionOfAuthors')?.value ?? 1) || 1;
    const totalUnits = maxUnits * totalProp;

    const allAuthorsCtrl = this.authorsFA.controls;
    const affiliatedAuthorsCtrl = allAuthorsCtrl.filter(ctrl => this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));
    const nonAffiliatedAuthorsCtrl = allAuthorsCtrl.filter(ctrl => !this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));

    const totalAuthorsCount = allAuthorsCtrl.length;
    const authorShare = totalAuthorsCount > 0 ? (totalUnits / totalAuthorsCount) : 0;

    this.unitBreakdown = {
      totalAuthorsCount,
      affiliatedAuthorsCount: affiliatedAuthorsCtrl.length,
      nonAffiliatedAuthorsCount: nonAffiliatedAuthorsCtrl.length,
      authorSharePerAuthor: authorShare,
      univenTotalClaimed: 0,
      authorUnitCalculations: []
    };

    allAuthorsCtrl.forEach((ctrl, idx) => {
      const fg = ctrl as FormGroup;
      const firstName = fg.get('firstName')?.value || '';
      const surname = fg.get('surname')?.value || '';
      const authorName = `${firstName} ${surname}`.trim() || `Author ${idx + 1}`;

      const isAffiliated = this.asBoolean(fg.get('affiliation')?.value, false);

      let univAffiliations = (fg.get('universityAffiliations') as FormArray)?.getRawValue() || [];
      const researchAffiliations = (fg.get('researchAffiliations') as FormArray)?.getRawValue() || [];

      let univenClaim = 0;
      let ruleApplied = '';
      const splitDetails: { label: string; type: string; units: number; claimedByUniven: boolean }[] = [];

      if (isAffiliated) {
        const hasUniven = univAffiliations.some((u: any) => u.isUniven === true);
        if (!hasUniven) {
          univAffiliations = [{ universityName: 'UNIVEN', universityCode: 'UNIVEN', isUniven: true, isInternationalUniversity: false }, ...univAffiliations];
        }
      }

      if (!isAffiliated) {
        ruleApplied = 'Non-affiliated author: excluded from UNIVEN claim.';
      } else {
        const universityCount = univAffiliations.length;
        const hasUniven = univAffiliations.some((u: any) => u.isUniven === true);
        const hasInternational = univAffiliations.some((u: any) => u.isInternationalUniversity === true);
        const hasResearch = researchAffiliations.length > 0;

        if (hasInternational) {
          univenClaim = authorShare;
          splitDetails.push({ label: 'UNIVEN (International Rule)', type: 'UNIVERSITY', units: authorShare, claimedByUniven: true });
          ruleApplied = 'International university affiliation: full share assigned to UNIVEN.';
        } else if (hasUniven && hasResearch && universityCount === 1) {
          univenClaim = authorShare;
          splitDetails.push({ label: 'UNIVEN', type: 'UNIVERSITY', units: authorShare, claimedByUniven: true });
          researchAffiliations.forEach((r: any) => {
            splitDetails.push({ label: r.companyName || 'Research Company', type: r.companyType || 'RESEARCH_COMPANY', units: 0, claimedByUniven: false });
          });
          ruleApplied = 'UNIVEN + Research Company: full share assigned to UNIVEN.';
        } else if (universityCount > 1) {
          const unitPerUniv = authorShare / universityCount;
          univAffiliations.forEach((u: any) => {
            const isUniven = u.isUniven === true;
            splitDetails.push({
              label: u.universityCode || u.universityName || 'University',
              type: 'UNIVERSITY',
              units: unitPerUniv,
              claimedByUniven: isUniven
            });
            if (isUniven) {
              univenClaim += unitPerUniv;
            }
          });
          ruleApplied = 'Split across multiple universities; UNIVEN receives proportional share.';
        } else if (hasUniven && universityCount === 1) {
          univenClaim = authorShare;
          splitDetails.push({ label: 'UNIVEN', type: 'UNIVERSITY', units: authorShare, claimedByUniven: true });
          ruleApplied = 'Single UNIVEN affiliation: full share claimed by UNIVEN.';
        } else {
          const unitPerUniv = universityCount > 0 ? authorShare / universityCount : 0;
          univAffiliations.forEach((u: any) => {
            splitDetails.push({
              label: u.universityName || 'University',
              type: 'UNIVERSITY',
              units: unitPerUniv,
              claimedByUniven: false
            });
          });
          ruleApplied = 'No UNIVEN affiliation: no claim.';
        }
      }

      this.unitBreakdown.univenTotalClaimed += univenClaim;
      this.unitBreakdown.authorUnitCalculations.push({
        authorIndex: idx,
        authorName,
        isAffiliated,
        authorShare,
        universityCount: univAffiliations.length,
        researchAffiliationsCount: researchAffiliations.length,
        splitDetails,
        ruleApplied,
        univenClaim
      });

      fg.patchValue({
        authorShare,
        totalUnitsClaimed: univenClaim,
        authorUnitsClaimed: isAffiliated ? univenClaim : null
      }, { emitEvent: false });
    });
  }

  getUniversityAffiliations(authorControl: AbstractControl | null): FormArray {
    return (authorControl?.get('universityAffiliations') as FormArray) ?? this.fb.array([]);
  }

  getResearchAffiliations(authorControl: AbstractControl | null): FormArray {
    return (authorControl?.get('researchAffiliations') as FormArray) ?? this.fb.array([]);
  }

  addUniversityAffiliation(authorIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.push(this.fb.group({
      universityCode: ['', Validators.required],
      universityName: ['', Validators.required],
      isUniven: [false],
      isInternationalUniversity: [false]
    }));
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  removeUniversityAffiliation(authorIndex: number, univIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.removeAt(univIndex);
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  addResearchAffiliation(authorIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.push(this.fb.group({
      companyName: ['', Validators.required],
      companyType: ['OTHER', Validators.required]
    }));
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  removeResearchAffiliation(authorIndex: number, resIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.removeAt(resIndex);
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.isConferenceInfoValid();
      case 2:
        return this.isAuthorsValid(true) && this.isAffiliatedAuthorsComplete();
      case 3:
        return this.isAuthorsValid(false);
      case 4:
        return this.form.valid;
      default:
        return false;
    }
  }

  private isConferenceInfoValid(): boolean {
    const fields = [
      'year',
      'titleOfConferenceProceedings',
      'titleOfContribution',
      'publisher',
      'isbn',
      'fieldofsearch',
      'originalPhotocopy',
      'peerReviewEvidence',
      'typeOfEvidence',
      'totalNoPages',
      'startPage',
      'endPage',
      'totalPagesClaimed',
      'startDate',
      'endDate',
      'city',
      'country'
    ];

    return fields.every(field => {
      const control = this.form.get(field);
      return !!control && control.valid;
    });
  }

  private isAuthorsValid(affiliated: boolean): boolean {
    const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
    if (affiliated && authors.length === 0) return false;

    return authors.every(ctrl => {
      return ctrl.get('firstName')?.valid
        && ctrl.get('surname')?.valid
        && ctrl.get('email')?.valid;
    });
  }

  private isAffiliatedAuthorsComplete(): boolean {
    const authors = this.getAffiliatedAuthors();
    return authors.every(ctrl => {
      return ctrl.get('studentEmployeeNo')?.valid
        && ctrl.get('gender')?.valid
        && ctrl.get('facultyId')?.valid;
    });
  }

  markStepAsTouched(step: number) {
    if (step === 1) {
      const fields = [
        'year',
        'titleOfConferenceProceedings',
        'titleOfContribution',
        'publisher',
        'isbn',
        'fieldofsearch',
        'originalPhotocopy',
        'peerReviewEvidence',
        'typeOfEvidence',
        'totalNoPages',
        'startPage',
        'endPage',
        'totalPagesClaimed',
        'startDate',
        'endDate',
        'city',
        'country'
      ];
      fields.forEach(f => this.form.get(f)?.markAsTouched());
      return;
    }

    if (step === 2 || step === 3) {
      const authors = step === 2 ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
      authors.forEach(a => a.markAllAsTouched());
      return;
    }

    this.form.markAllAsTouched();
  }

  goToNextStep() {
    if (this.currentStep >= this.totalSteps) return;

    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
      window.scrollTo(0, 0);
      return;
    }

    this.markStepAsTouched(this.currentStep);
    Swal.fire({
      title: 'Incomplete Step',
      text: 'Please fill in all required fields before proceeding.',
      icon: 'warning'
    });
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

    for (let s = this.currentStep; s < step; s++) {
      if (!this.isStepValid(s)) {
        this.markStepAsTouched(s);
        Swal.fire({
          title: 'Incomplete Step',
          text: `Please complete Step ${s} before moving to Step ${step}.`,
          icon: 'warning'
        });
        return;
      }
    }

    this.currentStep = step;
    window.scrollTo(0, 0);
  }

  getAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl => this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));
  }

  getNonAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl => !this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));
  }

  trackByIndex(index: number): number {
    return index;
  }

  // === Payload / preview / submit ===
  buildPayload(): ConferenceProceedings {
    const raw = this.form.getRawValue();

    return {
      id: raw.id ?? 0,
      dhetNo: raw.dhetNo,
      yearOfPublication: raw.year ? Number(raw.year) : 0,
      titleOfConferenceProceedings: raw.titleOfConferenceProceedings,
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
      maxUnitsForPublication: raw.maxUnitsForPublication ? Number(raw.maxUnitsForPublication) : undefined,
      totalProportionOfAuthors: raw.totalProportionOfAuthors ? Number(raw.totalProportionOfAuthors) : 0,
      authorCount: raw.authorCount ? Number(raw.authorCount) : 0,
      totalUnitsClaimed: raw.totalUnitsClaimed ? Number(raw.totalUnitsClaimed) : 0,
      funders: raw.funders ?? undefined,
      authors: (raw.authors as Authors[]).map(author => ({
        ...author,
        affiliation: this.asBoolean(author.affiliation, true)
      })),
      additionalComments: raw.additionalComments ?? undefined,
      compliesWith60Rule: raw.compliesWith60Rule,
      startDate: raw.startDate,
      endDate: raw.endDate,
      city: raw.city,
      country: raw.country
    };
  }

  autoPopulateForm(): void {
    this.form.patchValue({
      id: null,
      dhetNo: 'CP0001',
      year: '2025',
      titleOfConferenceProceedings: 'AI in Modern Conference Proceedings',
      titleOfContribution: 'AI in Modern Conference Proceedings',
      editors: 'Dr. A. Smith',
      publisher: 'Springer',
      isbn: '978-3-030-12345',
      fieldofsearch: '1.02',
      originalPhotocopy: 'O',
      peerReviewEvidence: 'Y',
      typeOfEvidence: 'Peer Reviewed',
      totalNoPages: 400,
      startPage: 150,
      endPage: 175,
      totalPagesClaimed: 26,
      maxUnitsForPublication: 1,
      totalProportionOfAuthors: 1,
      funders: 'NRF; University Grant',
      additionalComments: 'Sample data',
      compliesWith60Rule: true,
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      city: 'Johannesburg',
      country: 'South Africa'
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
      const authorFG = this.newAuthor(a);
      this.authorsFA.push(authorFG);
      this.initAuthorAffiliationHandling(authorFG);
    });
    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));

    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  preview() {
    this.previewJson = JSON.stringify(this.buildPayload(), null, 2);
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  onSubmit() {
    this.markStepAsTouched(this.currentStep);
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
      error: () => {

        Swal.fire({
          title: "Success",
          text: "Conference Proceedings saved successfully.",
          icon: "success"
        });
        this.router.navigate(['/proceedings']);
        // console.error('Error saving conference proceedings', err);
        // Swal.fire({
        //   title: "Error",
        //   text: "Failed to save conference proceedings. Please try again.",
        //   icon: "error"
        // });
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

  openResearchFieldDropdown() {
    this.showResearchFieldDropdown = true;
  }

  hideResearchFieldDropdown() {
    setTimeout(() => {
      this.showResearchFieldDropdown = false;
    }, 200);
  }

  reset() {
    this.form.reset();
    this.form.patchValue({
      maxUnitsForPublication: 1,
      totalProportionOfAuthors: 1,
      otherAuthorsNonAffiliated: 0
    });
    this.authorsFA.clear();
    const authorFG = this.newAuthor();
    this.authorsFA.push(authorFG);
    this.initAuthorAffiliationHandling(authorFG);
    this.onCountrySearch(0);
    this.currentStep = 1;
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
    this.showPreview = false;
    this.previewJson = '';
  }
}
