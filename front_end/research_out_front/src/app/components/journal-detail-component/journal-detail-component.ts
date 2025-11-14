
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup, FormsModule, ReactiveFormsModule,

  Validators
} from '@angular/forms';

import {Router} from '@angular/router';
import {Journal} from '../../models/journal.model';
import {AuthorAffiliation, Authors, ClaimingAuthorsContribution, Units} from '../../models/common.model';

// @ts-ignore
@Component({
  selector: 'app-journal-detail-component',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './journal-detail-component.html',
  styleUrl: './journal-detail-component.css'
})
const DOI_REGEX = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i;
const ISSN_REGEX = /^\d{4}-\d{3}[\dX]$/i;
export class JournalDetailComponent {
  showPreview = false;
  previewJson = '';
  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    const journal = this.router.getCurrentNavigation()?.extras.state?.['journal'];
    this.form = this.fb.group({
      dhetNo: [{ value: journal?.dhetNo || '', disabled: true }],
      year: [journal?.year || '', [Validators.required]],
      title: [journal?.title || '', [Validators.required]],
      publisher: [journal?.publisher || '', Validators.required],
      index: [journal?.index || ''],
      comply: [journal?.comply ?? null, Validators.required],
      volume: [journal?.volume ?? null],
      issue: [journal?.issue ?? null],
      issn: [journal?.issn || '', [this.patternOptional(ISSN_REGEX)]],
      eSsn: [journal?.eSsn || ''],
      doi: [journal?.doi || '', [this.patternOptional(DOI_REGEX)]],

      authors: this.fb.array(
        (journal?.authors && journal.authors.length
            ? journal.authors
            : [{} as Authors]
        ).map((a: Authors | undefined) => this.newAuthor(a))
      ),

      units: this.fb.array(
        (journal?.units && journal.units.length
            ? journal.units
            : [{} as Units]
        ).map((u: Units | undefined) => this.newUnit(u))
      ),

      authorAffiliation: this.fb.group({
        studentEmployeeNo: [journal?.authorAffiliation?.studentEmployeeNo ?? null, Validators.required],
        employmentStatus: [journal?.authorAffiliation?.employmentStatus || ''],
        academicTitle: [journal?.authorAffiliation?.academicTitle || ''],
        otherAffiliationsSaHeis: [journal?.authorAffiliation?.otherAffiliationsSaHeis || ''],
        otherAffiliationsSaInstitutions: [journal?.authorAffiliation?.otherAffiliationsSaInstitutions || ''],
        otherAffiliationsInternationalInstitutions: [journal?.authorAffiliation?.otherAffiliationsInternationalInstitutions || ''],
      }),

      claimingAuthorsContribution: this.fb.group({
        proportionOfAuthors: [journal?.claimingAuthorsContribution?.proportionOfAuthors ?? null],
        authorUnitsClaimed: [journal?.claimingAuthorsContribution?.authorUnitsClaimed ?? null],
        additionalComments: [journal?.claimingAuthorsContribution?.additionalComments || ''],
      }),
    });

    this.setupAutoCalc();
  }

  // === Getters ===
  get authorsFA(): FormArray {
    return this.form.get('authors') as FormArray;
  }

  get unitsFA(): FormArray {
    return this.form.get('units') as FormArray;
  }

  get authorAffiliationFG(): FormGroup {
    return this.form.get('authorAffiliation') as FormGroup;
  }

  get claimingAuthorsContributionFG(): FormGroup {
    return this.form.get('claimingAuthorsContribution') as FormGroup;
  }

  // === Builders ===
  newAuthor(a?: Authors): FormGroup {
    return this.fb.group({
      firstName: [a?.firstName || '', Validators.required],
      lastName: [a?.surname || '', Validators.required],
      //affiliation: [a?.affiliation || ''],
      //email: [a?.email || '', [this.patternOptional(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)]],
      orcid: [a?.orcid || '', [this.patternOptional(/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i)]],
     // corresponding: [a?.corresponding ?? false],
     // proportionOfAuthors: [a?.proportionOfAuthors ?? null],
    //  authorUnitsClaimed: [a?.authorUnitsClaimed ?? null],
     // additionalComments: [a?.additionalComments || ''],
    });
  }

  newUnit(u?: Units): FormGroup {
    return this.fb.group({
      maxUnitsForPublication: [u?.maxUnitsForPublication ?? null, Validators.required],
      totalProportionOfAuthors: [u?.totalProportionOfAuthors ?? 1],
      authorsCount: [u?.authorsCount ?? 1],
      totalUnitsClaimed: [u?.totalUnitsClaimed ?? null],
      otherAuthorsNonAffiliates: [u?.otherAuthorsNonAffiliates || ''],
      additionalComments: [u?.additionalComments || ''],
    });
  }

  // === Utils ===
  patternOptional(rx: RegExp) {
    return (control: FormControl) => {
      const val = (control.value || '').trim();
      return !val || rx.test(val) ? null : { pattern: true };
    };
  }

  addAuthor() {
    this.authorsFA.push(this.newAuthor());
    this.recalculateContributions();
  }

  removeAuthor(i: number) {
    this.authorsFA.removeAt(i);
    this.recalculateContributions();
  }

  addUnit() {
    this.unitsFA.push(this.newUnit());
    this.recalculateContributions();
  }

  removeUnit(i: number) {
    this.unitsFA.removeAt(i);
    this.recalculateContributions();
  }

  // === Auto-calculation logic ===
  setupAutoCalc() {
    this.authorsFA.valueChanges.subscribe(() => this.recalculateContributions());
    this.unitsFA.valueChanges.subscribe(() => this.recalculateContributions());
    this.recalculateContributions();
  }

  recalculateContributions() {
    if (!this.unitsFA.length) {
      return;
    }

    const unitsFG = this.unitsFA.at(0) as FormGroup;

    const maxUnits = unitsFG.get('maxUnitsForPublication')?.value || 0;
    const authorsCount = this.authorsFA.length || 1;

    unitsFG.get('authorsCount')?.setValue(authorsCount, { emitEvent: false });

    const proportion = 1 / authorsCount;
    const totalPropCtrl = unitsFG.get('totalProportionOfAuthors');
    const totalProp = totalPropCtrl?.value || 1;

    const totalUnits = maxUnits * totalProp;
    unitsFG.get('totalUnitsClaimed')?.setValue(totalUnits, { emitEvent: false });

    // @ts-ignore
    this.authorsFA.controls.forEach((ctrl: FormGroup<any>) => {
      const fg = ctrl as FormGroup;
      fg.get('proportionOfAuthors')?.setValue(proportion, { emitEvent: false });
      fg.get('authorUnitsClaimed')?.setValue(maxUnits * proportion, { emitEvent: false });
    });

    this.claimingAuthorsContributionFG.get('proportionOfAuthors')
      ?.setValue(proportion, { emitEvent: false });
    this.claimingAuthorsContributionFG.get('authorUnitsClaimed')
      ?.setValue(maxUnits * proportion, { emitEvent: false });
  }

  // === Payload / preview / submit ===
  buildPayload(): Journal {
    const raw = this.form.getRawValue();

    return {
      id: 0,
      dhetNo: raw.dhetNo,
      year: raw.year,
      title: raw.title,
      publisher: raw.publisher,
      index: raw.index,
      comply: raw.comply,
      volume: raw.volume,
      issue: raw.issue,
      issn: raw.issn,
      eSsn: raw.eSsn,
      doi: raw.doi,
      authors: raw.authors as Authors[],
      units: raw.units as Units[],
      authorAffiliation: raw.authorAffiliation as AuthorAffiliation,
      claimingAuthorsContribution: raw.claimingAuthorsContribution as ClaimingAuthorsContribution
    };
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
    console.log('Journal payload', this.buildPayload());
    alert('Demo submit – check console or Preview JSON.');
  }

  reset() {
    this.form.reset();
    this.authorsFA.clear();
    this.authorsFA.push(this.newAuthor());
    this.unitsFA.clear();
    this.unitsFA.push(this.newUnit());
    this.recalculateContributions();
    this.showPreview = false;
    this.previewJson = '';
  }


}
