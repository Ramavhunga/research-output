import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {Chapter} from '../../models/Chapter';
import {
  Authors,
  Department, Faculty, Attachment
} from '../../models/common.model';
import {ChapterService} from '../../services/chapter.service';
import {debounceTime, distinctUntilChanged, switchMap, Subscription, of, map} from 'rxjs';
import {CountriesService} from '../../services/countries.service';
import Swal from 'sweetalert2';
import {ResearchfieldService} from '../../services/researchfield.service';
import {Publisher, PublisherService} from '../../services/publisher.service';
import {
  AUTHOR_ACADEMIC_TITLE_OPTIONS,
  AUTHOR_EMPLOYMENT_STATUS_OPTIONS,
  AUTHOR_GENDER_OPTIONS,
  AUTHOR_HIGHEST_QUALIFICATION_OPTIONS,
  AUTHOR_POPULATION_GROUP_OPTIONS,
  AUTHOR_SA_RESIDENCY_OPTIONS,
  ISO_3166_COUNTRY_OPTIONS,
  SA_HEI_OPTIONS
} from '../../constants/author-form-options';

@Component({
  selector: 'app-chapter-detail-component',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './chapter-detail-component.html',
  standalone: true,
  styleUrl: './chapter-detail-component.css'
})
export class ChapterDetailComponent {
  private readonly currentYear = new Date().getFullYear();

  isReadOnlyView = false;
  showPreview = false;
  previewJson = '';
  form: FormGroup;
  faculties: Faculty[] = [];
  fieldofsearch: string[] = ["Agricultural Sciences", "Biological Sciences", "Chemical Sciences", "Computer and Information Sciences", "Sciences"];
  departmentsMap: { [index: number]: Department[] } = {};
  loadingFaculties = false;
  countryOptionsMap: { [index: number]: string[] } = {};
  countrySubs: { [index: number]: Subscription } = {};
  universitySearchTerms: { [rowKey: string]: string } = {};
  universityDropdownOpen: { [rowKey: string]: boolean } = {};

  readonly otherUniversityCode = 'OTHER';
  readonly saUniversityOptions = SA_HEI_OPTIONS;
  readonly genderOptions = AUTHOR_GENDER_OPTIONS;
  readonly populationGroupOptions = AUTHOR_POPULATION_GROUP_OPTIONS;
  readonly saResidencyOptions = AUTHOR_SA_RESIDENCY_OPTIONS;
  readonly employmentStatusOptions = AUTHOR_EMPLOYMENT_STATUS_OPTIONS;
  readonly academicTitleOptions = AUTHOR_ACADEMIC_TITLE_OPTIONS;
  readonly highestQualificationOptions = AUTHOR_HIGHEST_QUALIFICATION_OPTIONS;
  readonly countryOptions = ISO_3166_COUNTRY_OPTIONS;

  researchFields: any[] = [];
  filteredResearchFields: any[] = []
  showResearchFieldDropdown = false;
  publishers: Publisher[] = [];
  attachments: Attachment[] = [];
  fileError: string = '';
  newAttachmentDescription: string = '';
  selectedFile: File | null = null;
  currentStep = 1;
  totalSteps = 4;
  steps = [
    { id: 1, label: 'Chapter Information' },
    { id: 2, label: 'Affiliated Authors' },
    { id: 3, label: 'Non-Affiliated Authors' },
    { id: 4, label: 'Results & Submissions' }
  ];

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
      dhetNo: [{value: chapter?.dhetNo ?? 'C001', disabled: true}, [Validators.required, Validators.pattern(/^C\d+(\.\d+)?$/)]],

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
      originalPhotocopy: [this.normalizeOriginalPhotocopy(chapter?.originalOrPhotocopy), Validators.required],
      peerReviewEvidence: [this.normalizePeerReviewEvidence(chapter?.evidenceOfPeerReview), Validators.required],
      typeOfEvidence: [chapter?.typeOfEvidence ?? '', Validators.required],

       /** Pages - Required Fields */
       totalNoPages: [chapter?.totalNoPages ?? null, [Validators.required, Validators.min(1)]],
       startPage: [chapter?.startPage ?? null, [Validators.required, Validators.min(1)]],
       endPage: [chapter?.endPage ?? null, [Validators.required, Validators.min(1)]],
       totalPagesClaimed: [{value: chapter?.totalPagesClaimed ?? null, disabled: true}, [Validators.required, Validators.min(1)]],

      /** Chapters - Required Fields */
      totalChaptersInBook: [chapter?.totalChaptersInBook ?? null, [Validators.required, Validators.min(1)]],

      /** Units - Required Fields */
      maxUnitsForPublication: [chapter?.maxUnitsForPublication ?? 1],
      totalProportionOfAuthors: [chapter?.totalProportionOfAuthors ?? 1, [Validators.required, Validators.min(0), Validators.max(1)]],
      authorCount: [{value: chapter?.authorCount ?? 1, disabled: true}, Validators.required],
      otherAuthorsNonAffiliated: [{value: 0, disabled: true}],
      otherAuthorsNonAffiliatedList: [chapter?.otherAuthorsNonAffiliated ?? ''],
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
       validators: [this.pageRangeValidator()],
       asyncValidators: [this.checkTitleIsbnUnique(this.chapterService)],
       updateOn: 'blur'
     });

    this.setupFieldSearch();
    this.setupAutoCalc();
    this.applyChapterMaxUnitsRule();
    this.normalizeAllUniversityAffiliations();
    this.calculateAdvancedUnitBreakdown();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
  }

  private normalizeOriginalPhotocopy(value: string | undefined): 'O' | 'P' | '' {
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'O' || normalized === 'ORIGINAL') return 'O';
    if (normalized === 'P' || normalized === 'PHOTOCOPY') return 'P';
    return '';
  }

  private normalizePeerReviewEvidence(value: string | undefined): 'Y' | 'N' | '' {
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'Y' || normalized === 'YES') return 'Y';
    if (normalized === 'N' || normalized === 'NO') return 'N';
    return '';
  }

  private pageRangeValidator() {
    return (group: AbstractControl) => {
      const startPage = Number(group.get('startPage')?.value ?? 0);
      const endPage = Number(group.get('endPage')?.value ?? 0);
      const totalPagesClaimed = Number(group.get('totalPagesClaimed')?.value ?? 0);
      const totalNoPages = Number(group.get('totalNoPages')?.value ?? 0);

      if (startPage && endPage && startPage > endPage) {
        return { invalidPageRange: true };
      }

      if (endPage && totalNoPages && endPage > totalNoPages) {
        return { endPageExceedsBook: true };
      }

      if (startPage && endPage && totalPagesClaimed) {
        const expectedClaim = (endPage - startPage) + 1;
        if (expectedClaim !== totalPagesClaimed) {
          return { claimedPagesMismatch: true };
        }
      }

      return null;
    };
  }

  private submissionYearMotivationValidator() {
    return (group: AbstractControl) => {
      const year = Number(group.get('year')?.value ?? 0);
      const comments = String(group.get('additionalComments')?.value ?? '').trim();
      if (!year) {
        return null;
      }

      if (year < this.currentYear - 2 || year > this.currentYear - 1) {
        return { invalidSubmissionWindow: true };
      }

      // n-2 submissions require motivation text.
      if (year === this.currentYear - 2 && !comments) {
        return { motivationRequired: true };
      }

      return null;
    };
  }

  checkTitleIsbnUnique(chapterService: ChapterService) {
    return (group: AbstractControl) => {
      const title = group.get('titleOfContribution')?.value;
      const isbn = group.get('isbn')?.value;
      const currentIdRaw = group.get('id')?.value;
      const currentId = currentIdRaw === null || currentIdRaw === undefined || currentIdRaw === ''
        ? undefined
        : Number(currentIdRaw);

      if (!title || !isbn) return of(null);

      return chapterService.exists(title, isbn, Number.isFinite(currentId as number) ? currentId : undefined).pipe(
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
  newAuthor(a?: Authors, affiliation: boolean = true): FormGroup {
    const isAffiliated = this.asBoolean(a?.affiliation, affiliation);

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

    const fg = this.fb.group({
      id: [a?.id ?? null],
      affiliation: [isAffiliated],
      studentEmployeeNo: [a?.studentEmployeeNo || ''],
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
      additionalComments: [a?.additionalComments || ''],
      universityAffiliations: univArray,
      researchAffiliations: researchArray
    });

    this.updateAffiliatedValidators(fg, isAffiliated);
    return fg;
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

  private updateAffiliatedValidators(authorFG: FormGroup, isAffiliated: boolean): void {
    const affiliatedRequired = ['studentEmployeeNo', 'gender', 'facultyId'];
    affiliatedRequired.forEach(field => {
      const control = authorFG.get(field);
      if (!control) return;
      control.setValidators(isAffiliated ? [Validators.required] : []);
      if (!isAffiliated) {
        control.setValue(null, { emitEvent: false });
      }
      control.updateValueAndValidity({ emitEvent: false });
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
    if (totalChapters > 0 && totalChapters <= 10) {
      return 1.0;
    }
    if (totalChapters >= 11) {
      return Number((10 / totalChapters).toFixed(4));
    }
    return 0;
  }

  private applyChapterMaxUnitsRule(): void {
    const totalChapters = Number(this.form.get('totalChaptersInBook')?.value ?? 0);
    const maxUnits = this.calculateMaxUnitsForPublication(totalChapters);
    this.form.get('maxUnitsForPublication')?.setValue(maxUnits, { emitEvent: false });
    this.recalculateContributions();
  }

  getDaysArray(): string[] {
    const days: string[] = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString().padStart(2, '0'));
    }
    return days;
  }

  addAuthor(affiliation: boolean = true) {
    const authorFG = this.newAuthor(undefined, affiliation);
    this.updateAffiliatedValidators(authorFG, affiliation);
    this.authorsFA.push(authorFG);
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
      // Auto-calculate Total Pages Claimed based on Start Page and End Page
      this.form.get('startPage')?.valueChanges.pipe(
        debounceTime(300)
      ).subscribe(() => {
        this.calculateTotalPagesClaimed();
        this.recalculateContributions();
        this.calculateAdvancedUnitBreakdown();
      });

      this.form.get('endPage')?.valueChanges.pipe(
        debounceTime(300)
      ).subscribe(() => {
        this.calculateTotalPagesClaimed();
        this.recalculateContributions();
        this.calculateAdvancedUnitBreakdown();
      });

      // Listen to total chapters changes and recalculate units
      this.form.get('totalChaptersInBook')?.valueChanges.pipe(
        debounceTime(300)
      ).subscribe(() => {
        this.applyChapterMaxUnitsRule();
        this.calculateAdvancedUnitBreakdown();
      });

      // Listen to author count changes
      this.authorsFA.valueChanges.subscribe(() => {
        this.authorsFA.controls.forEach((authorControl) => {
          const authorFG = authorControl as FormGroup;
          this.updateAffiliatedValidators(authorFG, this.asBoolean(authorFG.get('affiliation')?.value, false));
        });
        this.recalculateContributions();
        this.calculateAdvancedUnitBreakdown();
      });

      // Listen to total proportion changes
      this.form.get('totalProportionOfAuthors')?.valueChanges.subscribe(() => {
        this.recalculateContributions();
        this.calculateAdvancedUnitBreakdown();
      });

      // Initial calculation
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
    }

    private calculateTotalPagesClaimed() {
      const startPage = Number(this.form.get('startPage')?.value ?? 0);
      const endPage = Number(this.form.get('endPage')?.value ?? 0);

      // Only calculate if both values exist and are valid (> 0)
      if (startPage > 0 && endPage > 0 && endPage >= startPage) {
        const calculatedPages = (endPage - startPage) + 1;
        // Use emitEvent: false to prevent recursive calculations
        this.form.get('totalPagesClaimed')?.setValue(calculatedPages, { emitEvent: false });
      }
    }

  recalculateContributions() {
    // Get all authors
    const allAuthors = this.authorsFA.controls;
    // Affiliated authors: those with affiliation === true
    const affiliatedAuthors = allAuthors.filter(ctrl => this.asBoolean(ctrl.get('affiliation')?.value, false));
    const nonAffiliatedAuthors = allAuthors.filter(ctrl => !this.asBoolean(ctrl.get('affiliation')?.value, false));
    const affiliatedCount = affiliatedAuthors.length;
    const nonAffiliatedCount = nonAffiliatedAuthors.length;

    const totalAuthors = allAuthors.length;

    // Excel requires total authors count (affiliated + non-affiliated).
    this.form.get('authorCount')?.setValue(totalAuthors || 1, { emitEvent: false });
    // Update non-affiliated count
    this.form.get('otherAuthorsNonAffiliated')?.setValue(nonAffiliatedCount, { emitEvent: false });

    // Get current values
    const maxUnits = this.form.get('maxUnitsForPublication')?.value || 0;
    // Calculate total proportion of authors (user input)
    const userDefinedProportion = this.form.get('totalProportionOfAuthors')?.value || 1;

    // Calculate total units claimed = maxUnits × totalProportionOfAuthors (using only affiliated authors)
    const totalUnitsClaimed = Number((maxUnits * userDefinedProportion).toFixed(4));
    this.form.get('totalUnitsClaimed')?.setValue(totalUnitsClaimed, { emitEvent: false });

    const perAuthorShare = totalAuthors > 0 ? Number((totalUnitsClaimed / totalAuthors).toFixed(4)) : 0;
    allAuthors.forEach(authorCtrl => {
      const fg = authorCtrl as FormGroup;
      fg.patchValue({
        authorShare: perAuthorShare,
        totalUnitsClaimed: perAuthorShare
      }, { emitEvent: false });
    });

    this.form.get('otherAuthorsNonAffiliatedList')?.setValue(this.buildNonAffiliatedAuthorList(nonAffiliatedAuthors), { emitEvent: false });
  }

  calculateAdvancedUnitBreakdown() {
    const maxUnits = Number(this.form.get('maxUnitsForPublication')?.value ?? 0) || 0;
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
          const unitPerUniv = universityCount > 0 ? (authorShare / universityCount) : 0;
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

      fg.patchValue({ authorShare, totalUnitsClaimed: univenClaim }, { emitEvent: false });
    });
  }

  getUniversityAffiliations(authorControl: AbstractControl | null): FormArray {
    return (authorControl?.get('universityAffiliations') as FormArray) ?? this.fb.array([]);
  }

  getResearchAffiliations(authorControl: AbstractControl | null): FormArray {
    return (authorControl?.get('researchAffiliations') as FormArray) ?? this.fb.array([]);
  }

  private findUniversityByCode(code: string): { code: string; name: string } | undefined {
    return this.saUniversityOptions.find(u => u.code === code);
  }

  private getUniversityRowKey(authorIndex: number, univIndex: number): string {
    return `${authorIndex}_${univIndex}`;
  }

  getUniversitySearchTerm(authorIndex: number, univIndex: number): string {
    return this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)] ?? '';
  }

  isUniversityDropdownOpen(authorIndex: number, univIndex: number): boolean {
    return this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] === true;
  }

  openUniversityDropdown(authorIndex: number, univIndex: number): void {
    this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = true;
  }

  closeUniversityDropdown(authorIndex: number, univIndex: number): void {
    setTimeout(() => {
      this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = false;
    }, 120);
  }

  onUniversitySearchChange(authorIndex: number, univIndex: number, value: string): void {
    this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)] = value ?? '';
    this.openUniversityDropdown(authorIndex, univIndex);
  }

  getFilteredUniversityOptions(authorIndex: number, univIndex: number): { code: string; name: string }[] {
    const term = this.getUniversitySearchTerm(authorIndex, univIndex).trim().toLowerCase();
    if (!term) return this.saUniversityOptions;

    return this.saUniversityOptions.filter(university =>
      university.name.toLowerCase().includes(term)
      || university.code.toLowerCase().includes(term)
    );
  }

  getUniversityDisplayValue(authorIndex: number, univIndex: number): string {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    const code = String(row?.get('universityCode')?.value ?? '').trim().toUpperCase();
    const name = String(row?.get('universityName')?.value ?? '').trim();

    if (!code) return '';
    if (code === this.otherUniversityCode) return name;
    const selected = this.findUniversityByCode(code);
    return selected ? `${selected.name} (${selected.code})` : name;
  }

  isOtherUniversitySelected(authorIndex: number, univIndex: number): boolean {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    const code = String(row?.get('universityCode')?.value ?? '').trim().toUpperCase();
    return code === this.otherUniversityCode;
  }

  selectUniversityOption(authorIndex: number, univIndex: number, university: { code: string; name: string }): void {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    row.patchValue(
      {
        universityCode: university.code,
        universityName: university.name,
        isUniven: university.code === 'UNIVEN'
      },
      { emitEvent: false }
    );

    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = false;
    this.calculateAdvancedUnitBreakdown();
  }

  selectOtherUniversity(authorIndex: number, univIndex: number): void {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    row.patchValue(
      {
        universityCode: this.otherUniversityCode,
        universityName: '',
        isUniven: false
      },
      { emitEvent: false }
    );

    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = false;
    this.calculateAdvancedUnitBreakdown();
  }

  private normalizeAllUniversityAffiliations(): void {
    this.authorsFA.controls.forEach((_, authorIndex) => this.normalizeUniversityAffiliationsForAuthor(authorIndex));
  }

  private normalizeUniversityAffiliationsForAuthor(authorIndex: number): void {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.controls.forEach((ctrl) => {
      const row = ctrl as FormGroup;
      const code = String(row.get('universityCode')?.value ?? '').trim().toUpperCase();
      const name = String(row.get('universityName')?.value ?? '').trim();
      const selected = this.findUniversityByCode(code);

      if (selected) {
        row.patchValue(
          {
            universityCode: selected.code,
            universityName: selected.name,
            isUniven: selected.code === 'UNIVEN'
          },
          { emitEvent: false }
        );
        return;
      }

      if (code || name) {
        row.patchValue(
          {
            universityCode: this.otherUniversityCode,
            universityName: name,
            isUniven: false
          },
          { emitEvent: false }
        );
      }
    });
  }

  addUniversityAffiliation(authorIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.push(this.fb.group({
      universityCode: ['', Validators.required],
      universityName: ['', Validators.required],
      isUniven: [false],
      isInternationalUniversity: [false]
    }));
    this.normalizeUniversityAffiliationsForAuthor(authorIndex);
    this.calculateAdvancedUnitBreakdown();
  }

  removeUniversityAffiliation(authorIndex: number, univIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.removeAt(univIndex);
    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    delete this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)];
    this.calculateAdvancedUnitBreakdown();
  }

  addResearchAffiliation(authorIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.push(this.fb.group({
      companyName: ['', Validators.required],
      companyType: ['OTHER', Validators.required]
    }));
    this.calculateAdvancedUnitBreakdown();
  }

  removeResearchAffiliation(authorIndex: number, resIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.removeAt(resIndex);
    this.calculateAdvancedUnitBreakdown();
  }

  private buildNonAffiliatedAuthorList(nonAffiliatedAuthors: AbstractControl[]): string {
    if (!nonAffiliatedAuthors.length) {
      return '';
    }

    const labels = nonAffiliatedAuthors
      .map((ctrl) => {
        const firstName = String(ctrl.get('firstName')?.value ?? '').trim();
        const surname = String(ctrl.get('surname')?.value ?? '').trim();
        return `${firstName} ${surname}`.trim();
      })
      .filter(Boolean);

    if (labels.length <= 10) {
      return labels.join('; ');
    }

    return `${labels.slice(0, 10).join('; ')}; et al`;
  }

  isStepValid(stepId: number): boolean {
    switch (stepId) {
      case 1:
        return this.isChapterInfoValid();
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

  private isChapterInfoValid(): boolean {
    const fields = [
       'year', 'titleOfBook', 'titleOfContribution', 'publisher',
      'isbn', 'fieldofsearch', 'originalPhotocopy', 'peerReviewEvidence',
      'typeOfEvidence', 'totalNoPages', 'startPage', 'endPage',
       'totalChaptersInBook',
    ];

    const controlsValid = fields.every(field => this.form.get(field)?.valid);
    return controlsValid
      && !this.form.hasError('invalidPageRange')
      && !this.form.hasError('endPageExceedsBook')
      && !this.form.hasError('claimedPagesMismatch')

  }

  private isAuthorsValid(affiliated: boolean): boolean {
    const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
    if (affiliated && authors.length === 0) return false;

    return authors.every(ctrl =>
      ctrl.get('firstName')?.valid
      && ctrl.get('surname')?.valid
      && ctrl.get('email')?.valid
    );
  }

  private isAffiliatedAuthorsComplete(): boolean {
    return this.getAffiliatedAuthors().every(ctrl =>
      ctrl.get('studentEmployeeNo')?.valid
      && ctrl.get('gender')?.valid
      && ctrl.get('facultyId')?.valid
    );
  }

  private markStepAsTouched(stepId: number): void {
    if (stepId === 1) {
      const fields = [
        'year', 'titleOfBook', 'titleOfContribution', 'publisher', 'isbn',
        'fieldofsearch', 'originalPhotocopy', 'peerReviewEvidence', 'typeOfEvidence',
        'totalNoPages', 'startPage', 'endPage', 'totalPagesClaimed',
        'totalChaptersInBook', 'totalProportionOfAuthors'
      ];
      fields.forEach(field => this.form.get(field)?.markAsTouched());
      return;
    }

    if (stepId === 2 || stepId === 3) {
      const authors = stepId === 2 ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
      authors.forEach(author => author.markAllAsTouched());
      return;
    }

    this.form.markAllAsTouched();
  }

  goToNextStep(): void {
    if (this.currentStep >= this.totalSteps) {
      return;
    }

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

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  goToStep(stepId: number): void {
    if (stepId === this.currentStep) {
      return;
    }

    if (stepId < this.currentStep) {
      this.currentStep = stepId;
      window.scrollTo(0, 0);
      return;
    }

    for (let s = this.currentStep; s < stepId; s++) {
      if (!this.isStepValid(s)) {
        this.markStepAsTouched(s);
        Swal.fire({
          title: 'Incomplete Step',
          text: `Please complete Step ${s} before moving to Step ${stepId}.`,
          icon: 'warning'
        });
        return;
      }
    }

    this.currentStep = stepId;
    window.scrollTo(0, 0);
  }

  getAffiliatedAuthors(): FormGroup[] {
    return this.authorsFA.controls
      .filter(ctrl => this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false))
      .map(ctrl => ctrl as FormGroup);
  }

  getNonAffiliatedAuthors(): FormGroup[] {
    return this.authorsFA.controls
      .filter(ctrl => !this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false))
      .map(ctrl => ctrl as FormGroup);
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
      otherAuthorsNonAffiliated: raw.otherAuthorsNonAffiliatedList ?? undefined,
      funders: raw.funders ?? undefined,
      authors: raw.authors as Authors[],
      additionalComments: raw.additionalComments ?? undefined
    };
  }

  autoPopulateForm(): void {
    this.form.patchValue({
      id: null,
      dhetNo: 'C0001',
      year: String(this.currentYear - 1),
      titleOfBook: 'Advanced Topics in Modern Research',
      titleOfContribution: 'Chapter 5: Advanced Methodologies',
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
      totalPagesClaimed: 25,
      totalChaptersInBook: 20,
      maxUnitsForPublication: 0.5,
      totalProportionOfAuthors: 0.5,
      otherAuthorsNonAffiliatedList: 'Smith J.; Doe K.',
      funders: 'NRF; University Grant',
      additionalComments: 'Sample data'
    });

    this.applyChapterMaxUnitsRule();

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

    authorsData.forEach(a => this.authorsFA.push(this.newAuthor(a, a.affiliation ?? true)));

    this.authorsFA.push(this.newAuthor({
      id: null,
      affiliation: false,
      studentEmployeeNo: '',
      firstName: 'External',
      surname: 'Author',
      initials: 'EA',
      gender: '',
      email: 'external.author@example.com',
      populationGroup: '',
      dob: '',
      orcid: '',
      countryOfBirth: '',
      saResidencyStatus: '',
      disability: false,
      highestQualification: '',
      employmentStatus: '',
      department: 0,
      faculty: 0,
      academicTitle: ''
    }, false));

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Validation required', 'Please fix validation errors before submitting.', 'warning');
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
        this.router.navigate(['/chapters']);
      },
      error: err => {
        console.error('Error saving chapter', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to save chapter. Please try again.',
          icon: 'error'
        });
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

  trackByIndex(index: number): number {
    return index;
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
    } else if (attachment.filePath) {
      window.open(attachment.filePath, '_blank');
    } else {
      Swal.fire({
        title: 'Attachment unavailable',
        text: 'This attachment has no fileData, URL, or filePath to open.',
        icon: 'warning'
      });
    }
  }

  reset() {
    this.form.reset();
    this.authorsFA.clear();
    this.authorsFA.push(this.newAuthor());
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
    this.showPreview = false;
    this.previewJson = '';
    this.attachments = [];
    this.fileError = '';
    this.newAttachmentDescription = '';
    this.selectedFile = null;
  }
}
