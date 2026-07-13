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
import { Book } from '../../models/Book';
import {
  Authors,
  Department, Faculty, Attachment
} from '../../models/common.model';
import { BookService } from '../../services/book.service';
import { debounceTime, distinctUntilChanged, switchMap, Subscription, of, map } from 'rxjs';
import { CountriesService } from '../../services/countries.service';
import Swal from 'sweetalert2';
import { ResearchfieldService } from '../../services/researchfield.service';
import { Publisher, PublisherService } from '../../services/publisher.service';
import { AuthorLookupService } from '../../services/author-lookup.service';
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
  selector: 'app-book-detail-component',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './book-detail-component.html',
  standalone: true,
  styleUrl: './book-detail-component.css'
})
export class BookDetailComponent {
  private readonly currentYear = new Date().getFullYear();

  isReadOnlyView = false;
  currentStatus = '';
  currentRoles: string[] = [];
  currentUsername = '';
  showPreview = false;
  previewJson = '';
  form: FormGroup;
  faculties: Faculty[] = [];
  fieldofsearch: string[] = ["Agricultural Sciences", "Biological Sciences", "Chemical Sciences", "Computer and Information Sciences", "Sciences"];
  departmentsMap: { [index: number]: Department[] } = {};
  loadingFaculties = false;
  countryOptionsMap: { [index: number]: string[] } = {};
  countrySubs: { [index: number]: Subscription } = {};
  authorLookupLoading: { [index: number]: boolean } = {};
  authorLookupErrors: { [index: number]: string } = {};
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
    { id: 1, label: 'Book Information' },
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
              private bookService: BookService,
              private countryService: CountriesService,
              private researchFieldService: ResearchfieldService,
              private publisherService: PublisherService,
              private authorLookupService: AuthorLookupService ) {

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
    const navigationState = this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {};
    const book = navigationState['book'] as Book | undefined;
    this.isReadOnlyView = !!(navigationState['reviewMode'] || navigationState['viewMode'] || navigationState['readOnly']);
    this.currentStatus = this.normalizeStatus((book as any)?.status);
    this.currentRoles = this.getCurrentRoles();
    this.currentUsername = this.getCurrentUsername();

    this.form = this.fb.group({
      id: [book?.id ?? null],
      attachments :[book?.attachments??[]],
       /** Core DHET - Required Fields */
       dhetNo: [{value: book?.dhetNo ?? 'B001', disabled: true}, [Validators.required, Validators.pattern(/^B\d+$/)]],

       year: [book?.yearOfPublication ?? '', Validators.required],
      titleOfBook: [book?.titleOfBook ?? '', Validators.required],
      editors: [book?.editors ?? ''],
      publisher: [book?.publisher ?? '', Validators.required],
      isbn: [
        book?.isbn ?? '',
        [Validators.required]
      ],
      fieldofsearch: [book?.fieldOfResearch ?? '', Validators.required],

      /** Publication Details - Required Fields */
      originalPhotocopy: [this.normalizeOriginalPhotocopy(book?.originalOrPhotocopy), Validators.required],
      peerReviewEvidence: [this.normalizePeerReviewEvidence(book?.evidenceOfPeerReview), Validators.required],
      typeOfEvidence: [book?.typeOfEvidence ?? '', Validators.required],

       /** Pages - Required Fields */
       totalNoPages: [book?.totalNoPages ?? null, [Validators.required, Validators.min(1)]],
       startPage: [book?.startPage ?? null, [Validators.required, Validators.min(1)]],
       endPage: [book?.endPage ?? null, [Validators.required, Validators.min(1)]],
       totalPagesClaimed: [{value: book?.totalPagesClaimed ?? null, disabled: true}, [Validators.required, Validators.min(1)]],

      /** Units - Required Fields */
      maxUnitsForPublication: [book?.maxUnitsForPublication ?? 0],
      totalProportionOfAuthors: [book?.totalProportionOfAuthors ?? 1, [Validators.required, Validators.min(0), Validators.max(1)]],
      authorCount: [{value: book?.authorCount ?? 1, disabled: true}, Validators.required],
      otherAuthorsNonAffiliated: [{value: 0, disabled: true}],
      otherAuthorsNonAffiliatedList: [book?.otherAuthorsNonAffiliated ?? ''],
      totalUnitsClaimed: [{value: book?.totalUnitsClaimed ?? null, disabled: true}, Validators.required],

      /** Optional Fields */
      funders: [book?.funders ?? ''],

      additionalComments: [book?.additionalComments ?? ''],
      authors: this.fb.array(
        book?.authors?.length
          ? book.authors.map(a => this.newAuthor(a, this.asBoolean(a.affiliation, true)))
          : [this.newAuthor()]
      ),

    },{
      validators: [this.pageRangeValidator()],
      asyncValidators: [this.checkTitleIsbnUnique(this.bookService)],
      updateOn: 'blur'
    });

    this.setupFieldSearch();
    this.setupAutoCalc();
    this.normalizeAllUniversityAffiliations();
    this.calculateAdvancedUnitBreakdown();
    this.attachments = this.normalizeAttachments(this.extractRawAttachments(book));
    this.loadAttachmentsFromBackend(book?.id);

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));

    if (this.isReadOnlyView) {
      this.disableValidationForReadOnlyMode();
      this.form.disable({ emitEvent: false });
    }
  }

  private loadAttachmentsFromBackend(bookId?: number): void {
    if (!bookId) return;

    this.bookService.getById(bookId).subscribe({
      next: (fullBook) => {
        this.attachments = this.normalizeAttachments(this.extractRawAttachments(fullBook));
      },
      error: (err) => {
        console.warn('Failed to load book attachments for detail view', err);
      }
    });
  }

  private extractRawAttachments(source: unknown): unknown {
    const record = source as any;
    if (!record) return [];

    return record.attachments
      ?? record.attachment
      ?? record.files
      ?? record.documents
      ?? [];
  }

  private normalizeAttachments(rawAttachments: unknown): Attachment[] {
    let list: unknown[] = [];

    if (Array.isArray(rawAttachments)) {
      list = rawAttachments;
    } else if (typeof rawAttachments === 'string') {
      try {
        const parsed = JSON.parse(rawAttachments);
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = [];
      }
    } else if (rawAttachments && typeof rawAttachments === 'object') {
      const wrapper = rawAttachments as any;
      const candidates = [wrapper.items, wrapper.content, wrapper.data, wrapper.rows];
      const firstArray = candidates.find(Array.isArray);
      list = Array.isArray(firstArray) ? firstArray : [];
    }

    return list
      .map((item: any) => ({
        id: item?.id ?? null,
        formguid: item?.formguid ?? item?.formGuid ?? undefined,
        fileName: item?.fileName ?? item?.filename ?? item?.name ?? '',
        fileType: item?.fileType ?? item?.filetype ?? item?.mimeType ?? item?.contentType ?? 'application/pdf',
        fileSize: Number(item?.fileSize ?? item?.filesize ?? item?.size ?? 0) || 0,
        fileData: item?.fileData ?? item?.data ?? item?.base64 ?? undefined,
        filePath: item?.filePath ?? item?.filepath ?? null,
        url: item?.url ?? item?.fileUrl ?? item?.downloadUrl ?? undefined,
        description: item?.description ?? item?.desc ?? ''
      } as Attachment))
      .filter(att => !!att.fileName);
  }

  private disableValidationForReadOnlyMode(): void {
    this.clearValidatorsRecursively(this.form);
  }

  private clearValidatorsRecursively(control: AbstractControl): void {
    control.clearValidators();
    control.clearAsyncValidators();

    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(child => this.clearValidatorsRecursively(child));
    }

    if (control instanceof FormArray) {
      control.controls.forEach(child => this.clearValidatorsRecursively(child));
    }

    control.updateValueAndValidity({ emitEvent: false });
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

  // private submissionYearMotivationValidator() {
  //   return (group: AbstractControl) => {
  //     const year = Number(group.get('year')?.value ?? 0);
  //     const comments = String(group.get('additionalComments')?.value ?? '').trim();
  //     if (!year) {
  //       return null;
  //     }
  //
  //     if (year < this.currentYear - 2 || year > this.currentYear - 1) {
  //       return { invalidSubmissionWindow: true };
  //     }
  //
  //     // n-2 submissions require motivation text.
  //     if (year === this.currentYear - 2 && !comments) {
  //       return { motivationRequired: true };
  //     }
  //
  //     return null;
  //   };
  // }

  checkTitleIsbnUnique(bookService: BookService) {
    return (group: AbstractControl) => {
      const title = group.get('titleOfBook')?.value;
      const isbn = group.get('isbn')?.value;
      const currentIdRaw = group.get('id')?.value;
      const currentId = currentIdRaw === null || currentIdRaw === undefined || currentIdRaw === ''
        ? undefined
        : Number(currentIdRaw);

      if (!title || !isbn) return of(null);

      return bookService.exists(title, isbn, Number.isFinite(currentId as number) ? currentId : undefined).pipe(
        debounceTime(300),
        map((exists: boolean) => {
          return exists ? { duplicateBook: true } : null;
        })
      );
    };
  }

  private getCurrentUsername(): string {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) return '';

    try {
      const loginData = JSON.parse(loginRaw);
      return (loginData?.user?.username ?? loginData?.username ?? '').toString().trim();
    } catch {
      return '';
    }
  }

  private getCurrentRoles(): string[] {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) return [];

    try {
      const loginData = JSON.parse(loginRaw);
      const roleSource = loginData?.user?.roles ?? loginData?.user?.userType ?? loginData?.userType ?? '';
      if (Array.isArray(roleSource)) {
        return roleSource.map((r: any) => String(r).toUpperCase().trim()).filter(Boolean);
      }
      return String(roleSource)
        .split(',')
        .map((r: string) => r.toUpperCase().trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private normalizeStatus(status: unknown): string {
    return String(status ?? '').toUpperCase().trim();
  }

  private isApproverRole(roles: string[]): boolean {
    return roles.includes('ADMIN')
      || roles.includes('ADMINISTRATOR')
      || roles.includes('REVIEWER_LEVEL_1')
      || roles.includes('LEVEL_1_APPROVER')
      || roles.includes('REVIEWER_LEVEL_2')
      || roles.includes('LEVEL_2_APPROVER');
  }

  private canCurrentApproverDecideOnStatus(roles: string[], status: string): boolean {
    if (!status) return false;

    if (roles.includes('ADMIN') || roles.includes('ADMINISTRATOR')) {
      return status !== 'READY_FOR_POSTING' && status !== 'POSTED_TO_DHET';
    }

    const isL1 = roles.includes('REVIEWER_LEVEL_1') || roles.includes('LEVEL_1_APPROVER');
    const isL2 = roles.includes('REVIEWER_LEVEL_2') || roles.includes('LEVEL_2_APPROVER');
    const l1Stage = status === 'SUBMITTED' || status === 'UNDER_REVIEW_L1';
    const l2Stage = status === 'UNDER_REVIEW_L2';
    return (isL1 && l1Stage) || (isL2 && l2Stage);
  }

  canShowReviewDecisionActions(): boolean {
    return !this.isReadOnlyView
      && this.isApproverRole(this.currentRoles)
      && this.canCurrentApproverDecideOnStatus(this.currentRoles, this.currentStatus);
  }

  shouldHideReviewStepperActions(): boolean {
    return this.isApproverRole(this.currentRoles) && !!this.currentStatus;
  }

  async approveFromReview(): Promise<void> {
    if (!this.canShowReviewDecisionActions()) return;

    const id = Number(this.form.get('id')?.value ?? 0);
    if (!id) {
      Swal.fire('Error', 'Missing book id for approval.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Approve book?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      inputValidator: (value) => !String(value ?? '').trim() ? 'Comments are required' : null
    });

    if (!result.isConfirmed) return;
    const comments = String(result.value).trim();
    const payload = this.buildPayload();

    this.bookService.save(payload, this.currentUsername).pipe(
      switchMap(() => this.bookService.approve(id, this.currentUsername, comments))
    ).subscribe({
      next: (updated) => {
        this.currentStatus = this.normalizeStatus((updated as any)?.status);
        Swal.fire('Approved', 'Book changes were saved and moved to the next stage.', 'success').then(() => {
          this.router.navigate(['/review-dashboard']);
        });
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message ?? 'Could not save changes and approve the book.', 'error');
      }
    });
  }

  async declineFromReview(): Promise<void> {
    if (!this.canShowReviewDecisionActions()) return;

    const id = Number(this.form.get('id')?.value ?? 0);
    if (!id) {
      Swal.fire('Error', 'Missing book id for decline.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Decline book?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      confirmButtonText: 'Decline',
      inputValidator: (value) => !String(value ?? '').trim() ? 'Comments are required' : null
    });

    if (!result.isConfirmed) return;
    const comments = String(result.value).trim();

    this.bookService.reject(id, this.currentUsername, comments).subscribe({
      next: (updated) => {
        this.currentStatus = this.normalizeStatus((updated as any)?.status);
        Swal.fire('Declined', 'Book has been declined.', 'success').then(() => {
          this.router.navigate(['/review-dashboard']);
        });
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message ?? 'Decline failed.', 'error');
      }
    });
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
    this.bookService.getFaculties().subscribe({
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

  get authorsFA(): FormArray {
    return this.form.get('authors') as FormArray;
  }

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

  patternOptional(rx: RegExp) {
    return (control: FormControl) => {
      const val = (control.value || '').trim();
      return !val || rx.test(val) ? null : {pattern: true};
    };
  }

  calculateMaxUnitsForBook(totalPagesClaimed: number): number {
    if (totalPagesClaimed < 60) return 0;
    if (totalPagesClaimed < 90) return 2;
    if (totalPagesClaimed < 120) return 3;
    if (totalPagesClaimed < 150) return 4;
    if (totalPagesClaimed < 180) return 5;
    if (totalPagesClaimed < 210) return 6;
    if (totalPagesClaimed < 240) return 7;
    if (totalPagesClaimed < 270) return 8;
    if (totalPagesClaimed < 300) return 9;
    return 10;
  }

  getDaysArray(): string[] {
    const days: string[] = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString().padStart(2, '0'));
    }
    return days;
  }

  addAuthor(affiliation: boolean = true) {
    if (this.isReadOnlyView) return;
    const authorFG = this.newAuthor(undefined, affiliation);
    this.updateAffiliatedValidators(authorFG, affiliation);
    this.authorsFA.push(authorFG);
    const i = this.authorsFA.length - 1;
    this.onCountrySearch(i);
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  removeAuthor(i: number) {
    if (this.isReadOnlyView) return;
    this.authorsFA.removeAt(i);
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

   setupAutoCalc() {
      // Auto-calculate Total Pages Claimed based on Start Page and End Page
      this.form.get('startPage')?.valueChanges.pipe(
        debounceTime(300)
      ).subscribe(() => {
        this.calculateTotalPagesClaimed();
        // Trigger recalculation of units after page calculation
        const totalPagesClaimed = this.form.get('totalPagesClaimed')?.value;
        if (totalPagesClaimed) {
          const maxUnits = this.calculateMaxUnitsForBook(Number(totalPagesClaimed));
          this.form.get('maxUnitsForPublication')?.setValue(maxUnits, { emitEvent: false });
          this.recalculateContributions();
          this.calculateAdvancedUnitBreakdown();
        }
      });

      this.form.get('endPage')?.valueChanges.pipe(
        debounceTime(300)
      ).subscribe(() => {
        this.calculateTotalPagesClaimed();
        // Trigger recalculation of units after page calculation
        const totalPagesClaimed = this.form.get('totalPagesClaimed')?.value;
        if (totalPagesClaimed) {
          const maxUnits = this.calculateMaxUnitsForBook(Number(totalPagesClaimed));
          this.form.get('maxUnitsForPublication')?.setValue(maxUnits, { emitEvent: false });
          this.recalculateContributions();
          this.calculateAdvancedUnitBreakdown();
        }
      });

      this.authorsFA.valueChanges.subscribe(() => {
        this.authorsFA.controls.forEach((authorControl) => {
          const authorFG = authorControl as FormGroup;
          this.updateAffiliatedValidators(authorFG, this.asBoolean(authorFG.get('affiliation')?.value, false));
        });
        this.recalculateContributions();
        this.calculateAdvancedUnitBreakdown();
      });

      this.form.get('totalProportionOfAuthors')?.valueChanges.subscribe(() => {
        this.recalculateContributions();
        this.calculateAdvancedUnitBreakdown();
      });

      this.form.get('maxUnitsForPublication')?.valueChanges.subscribe(() => {
        this.recalculateContributions();
        this.calculateAdvancedUnitBreakdown();
      });

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
    const allAuthors = this.authorsFA.controls;
    const nonAffiliatedAuthors = allAuthors.filter(
      ctrl => !this.asBoolean(ctrl.get('affiliation')?.value, false)
    );
    const totalAuthors = allAuthors.length;

    this.form.get('authorCount')?.setValue(totalAuthors || 1, { emitEvent: false });
    this.form.get('otherAuthorsNonAffiliated')?.setValue(nonAffiliatedAuthors.length, { emitEvent: false });

    const maxUnits = this.form.get('maxUnitsForPublication')?.value || 0;
    const userDefinedProportion = this.form.get('totalProportionOfAuthors')?.value || 1;

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
    if (this.isReadOnlyView) return;
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
    if (this.isReadOnlyView) return;
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
    if (this.isReadOnlyView) return;
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
    if (this.isReadOnlyView) return;
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.removeAt(univIndex);
    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    delete this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)];
    this.calculateAdvancedUnitBreakdown();
  }

  addResearchAffiliation(authorIndex: number) {
    if (this.isReadOnlyView) return;
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.push(this.fb.group({
      companyName: ['', Validators.required],
      companyType: ['OTHER', Validators.required]
    }));
    this.calculateAdvancedUnitBreakdown();
  }

  removeResearchAffiliation(authorIndex: number, resIndex: number) {
    if (this.isReadOnlyView) return;
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
    if (this.isReadOnlyView) {
      return true;
    }

    switch (stepId) {
      case 1:
        return this.isBookInfoValid();
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

  private isBookInfoValid(): boolean {
    if (this.isReadOnlyView) {
      return true;
    }

    const fields = [
      'year', 'titleOfBook', 'publisher',
      'isbn', 'fieldofsearch', 'originalPhotocopy', 'peerReviewEvidence',
      'typeOfEvidence', 'totalNoPages', 'startPage', 'endPage'
    ];

    const controlsValid = fields.every(field => this.form.get(field)?.valid);
    return controlsValid
      && !this.form.hasError('invalidPageRange')
      && !this.form.hasError('endPageExceedsBook')
      && !this.form.hasError('claimedPagesMismatch');
  }

  private isAuthorsValid(affiliated: boolean): boolean {
    if (this.isReadOnlyView) {
      return true;
    }

    const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
    if (affiliated && authors.length === 0) return false;

    return authors.every(ctrl =>
      ctrl.get('firstName')?.valid
      && ctrl.get('surname')?.valid
      && ctrl.get('email')?.valid
    );
  }

  private isAffiliatedAuthorsComplete(): boolean {
    if (this.isReadOnlyView) {
      return true;
    }

    return this.getAffiliatedAuthors().every(ctrl =>
      ctrl.get('studentEmployeeNo')?.valid
      && ctrl.get('gender')?.valid
      && ctrl.get('facultyId')?.valid
    );
  }

  private markStepAsTouched(stepId: number): void {
    if (this.isReadOnlyView) {
      return;
    }

    if (stepId === 1) {
      const fields = [
        'year', 'titleOfBook', 'publisher', 'isbn',
        'fieldofsearch', 'originalPhotocopy', 'peerReviewEvidence', 'typeOfEvidence',
         'startPage', 'endPage',

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

  buildPayload(): Book {
     const raw = this.form.getRawValue();

     // Convert publisher ID to publisher name
  //   const publisherName = this.getPublisherName(raw.publisher);
debugger;
     return {
       id: raw.id ?? 0,
       dhetNo: raw.dhetNo,
       yearOfPublication: raw.year ? Number(raw.year) : 0,
       titleOfBook: raw.titleOfBook,
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
       otherAuthorsNonAffiliated: raw.otherAuthorsNonAffiliatedList ?? undefined,
       funders: raw.funders ?? undefined,
       authors: raw.authors as Authors[],
       attachments: (this.attachments ?? []).map(att => ({
         id: att.id,
         formguid: att.formguid,
         fileName: att.fileName,
         fileSize: Number(att.fileSize ?? 0),
         fileType: att.fileType,
         fileData: att.fileData,
         filePath: att.filePath ?? null,
         url: att.url,
         description: att.description ?? ''
       })),
       additionalComments: raw.additionalComments ?? undefined
     };
   }

   private getPublisherName(publisherId: number | string): string {
     if (!publisherId) return '';
     const publisher = this.publishers.find(p => p.id === publisherId || p.id === Number(publisherId));
     return publisher?.name ?? '';
   }

  autoPopulateForm(): void {
    if (this.isReadOnlyView) return;
    this.form.patchValue({
      id: null,
      dhetNo: 'B001',
      year: String(this.currentYear - 1),
      titleOfBook: 'Advanced Topics in Modern Research',
      editors: 'Dr. A. Smith',
      publisher: 'Wiley',
      isbn: '978-0-471-12345',
      fieldofsearch: '1.02',
      originalPhotocopy: 'O',
      peerReviewEvidence: 'Y',
      typeOfEvidence: 'Peer Reviewed',
      totalNoPages: 450,
      startPage: 1,
      endPage: 450,
      totalPagesClaimed: 450,
      totalProportionOfAuthors: 0.5,
      funders: 'NRF; University Grant',
      additionalComments: 'Sample data'
    });

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
  }

  preview() {
    this.previewJson = JSON.stringify(this.buildPayload(), null, 2);
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  onSubmit() {
    if (this.isReadOnlyView) return;

    const payload = this.buildPayload();

    this.bookService.save(payload).subscribe({
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
          title: 'Error',
          text: 'Failed to save book. Please try again.',
          icon: 'error'
        });
      }
    });
  }



  onFacultyChange(authorIndex: number, event?: Event) {
    const authorFG = this.authorsFA.at(authorIndex) as FormGroup;

    const toId = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'object' && value !== null && 'id' in (value as Record<string, unknown>)) {
        return toId((value as Record<string, unknown>)['id']);
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const angularEncodedMatch = trimmed.match(/^\d+:\s*(.+)$/);
        if (angularEncodedMatch) {
          return toId(angularEncodedMatch[1]);
        }
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const loadDepartments = (facultyId: number): void => {
      this.bookService.getDepartmentsByFaculty(facultyId).subscribe({
        next: (deps) => {
          this.departmentsMap[authorIndex] = deps ?? [];
          authorFG.get('department')?.reset();
        },
        error: (err) => {
          console.error('Failed to load departments', err);
        }
      });
    };

    const controlFacultyId = toId(authorFG.get('faculty')?.value);
    const eventFacultyId = event?.target
      ? toId((event.target as HTMLSelectElement).value)
      : null;

    const facultyId = controlFacultyId ?? eventFacultyId;
    if (facultyId) {
      loadDepartments(facultyId);
      return;
    }

    // If change fires before control settles, retry once on microtask queue.
    Promise.resolve().then(() => {
      const delayedFacultyId = toId(authorFG.get('faculty')?.value);
      if (delayedFacultyId) {
        loadDepartments(delayedFacultyId);
      } else {
        this.departmentsMap[authorIndex] = [];
        authorFG.get('department')?.reset();
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

  isAuthorLookupLoading(index: number): boolean {
    return this.authorLookupLoading[index] === true;
  }

  onStudentEmployeeNoBlur(authorIndex: number): void {
    this.authorLookupService.performAuthorLookup(
      authorIndex,
      this.authorsFA,
      this.faculties,
      this.departmentsMap,
      null,
      this.authorLookupLoading,
      this.authorLookupErrors
    );
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
    if (this.isReadOnlyView) return;
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
    if (this.isReadOnlyView) return;
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
    if (this.isReadOnlyView) return;
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
    if (this.isReadOnlyView) return;
    this.form.reset();
    this.authorsFA.clear();
    this.authorsFA.push(this.newAuthor());
    this.recalculateContributions();
    this.showPreview = false;
    this.previewJson = '';
    this.attachments = [];
    this.fileError = '';
    this.newAttachmentDescription = '';
    this.selectedFile = null;
  }
}
