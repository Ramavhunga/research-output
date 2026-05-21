# Author Unit Calculation & Affiliation Handling Implementation

## Overview
Complete implementation of unit calculation system based on author affiliations with support for multiple universities and research companies.

## Files Modified

### 1. **common.model.ts** - Added Affiliation Interfaces
```typescript
// New interfaces
export interface AuthorAffiliationDetail {
  universityCode: string;
  universityName: string;
  isUniven: boolean;
}

export interface AuthorResearchAffiliation {
  companyName: string;
  companyType: 'RESEARCH_COMPANY' | 'OTHER';
}

// Extended Authors interface with new fields:
- universityAffiliations?: AuthorAffiliationDetail[]
- researchAffiliations?: AuthorResearchAffiliation[]
- authorShare?: number
- unitsPerUniversity?: { [key: string]: number }
- totalUnitsClaimed?: number
```

### 2. **journal-detail-component.ts** - Core Logic Implementation

#### New Properties
```typescript
unitBreakdown: {
  affiliatedAuthorsCount: number;
  nonAffiliatedAuthorsCount: number;
  authorSharePerAuthor: number;
  univenTotalClaimed: number;
  authorUnitCalculations: DetailedCalculation[];
}
```

#### Key Methods
1. **calculateAdvancedUnitBreakdown()**
   - Calculates units per author based on affiliation rules
   - Handles multiple universities with equal splits
   - Applies UNIVEN + Research Company rule (full unit to UNIVEN)
   - Tracks per-university breakdowns

2. **addUniversityAffiliation(authorIndex)**
   - Adds new university form group to university affiliations array
   - Fields: universityCode, universityName, isUniven checkbox

3. **removeUniversityAffiliation(authorIndex, univIndex)**
   - Removes university and recalculates units

4. **addResearchAffiliation(authorIndex)**
   - Adds research company/organization to affiliations
   - Fields: companyName, companyType (RESEARCH_COMPANY or OTHER)

5. **removeResearchAffiliation(authorIndex, resIndex)**
   - Removes research affiliation and recalculates

6. **getUniversityAffiliations(authorFG)**
   - Helper to get FormArray of university affiliations

7. **getResearchAffiliations(authorFG)**
   - Helper to get FormArray of research affiliations

#### Enhanced Methods
- **setupAutoCalc()** - Now calls `calculateAdvancedUnitBreakdown()` on all changes
- **addAuthor()** - Triggers advanced calculation after adding
- **removeAuthor()** - Triggers advanced calculation after removing
- **newAuthor()** - Extended to include university and research affiliation form arrays

### 3. **journal-detail-component.html** - UI Implementation

#### Affiliation & Unit Calculation Section (Per Author)
Located in Step 2 (Affiliated Authors), each author card now includes:

**A. Unit Display Cards (3 cards)**
- Author Share: Shows base unit allocation
- UNIVEN Claim: Shows units claimed by UNIVEN
- Affiliations: Shows count of universities and organizations

**B. University Affiliations Section**
- Dynamic FormArray for multiple universities
- Each entry includes:
  - University Code (e.g., UNIVEN, UNISA)
  - University Name (full name)
  - "Is UNIVEN?" checkbox
  - Remove button
- "Add University" button for dynamic addition

**C. Research Company/Organization Section**
- Dynamic FormArray for research affiliations
- Each entry includes:
  - Company/Organization Name
  - Type dropdown (Research Company / Other)
  - Remove button
- "Add Organization" button

#### Unit Breakdown Summary (Global)
Appears after the author list with:

**Summary Cards (4 cards)**
- Affiliated Authors Count
- Non-Affiliated Authors Count
- Per Author Share (calculated value)
- UNIVEN Total Claim (success badge)

**Detailed Breakdown Table**
| Author | Author Share | Universities | Has Research Org | UNIVEN Claim | Breakdown |
|--------|--------------|--------------|------------------|--------------|-----------|
| ... | ... | ... | ... | ... | Unit splits per university |

**Rules Applied Section**
Listed rules for transparency:
- Total units split equally among affiliated authors
- Non-affiliated authors receive no units
- Multiple university affiliations split equally
- UNIVEN + Research Company = full unit to UNIVEN

## Calculation Rules Implemented

### Rule 1: Basic Unit Division
```
Each affiliated author share = Total Units / Number of Affiliated Authors
Non-affiliated authors = 0 units
```

### Rule 2: Multiple Universities
```
If author has 2+ universities:
  Units per university = Author Share / Number of Universities
```

### Rule 3: UNIVEN + Research Company
```
If author affiliated with UNIVEN AND Research Company:
  UNIVEN gets: Full Author Share
  Research Company gets: 0 units (informational only)
```

### Rule 4: Research Company Only
```
If author has ONLY research company affiliations:
  UNIVEN claim = 0 units
```

## Data Flow

1. **User adds author** → `addAuthor(true)` called
2. **User modifies affiliations** → `valueChanges` subscription triggered
3. **calculateAdvancedUnitBreakdown()** executed
4. **unitBreakdown** object updated with calculations
5. **Form values updated** (authorShare, totalUnitsClaimed)
6. **Template reactively displays** updated values

## Usage Example

### Scenario: 4 Authors with 1 Total Unit

**Author 1 (UNIVEN only)**
- Author Share: 0.25
- UNIVEN Claim: 0.25 ✓

**Author 2 (UNIVEN + UNISA)**
- Author Share: 0.25
- UNIVEN Claim: 0.125 (0.25 / 2 universities)
- UNISA Claim: 0.125

**Author 3 (UNIVEN + Research Company ABC)**
- Author Share: 0.25
- UNIVEN Claim: 0.25 ✓ (full unit due to rule 3)
- ABC Claim: 0 (research only)

**Author 4 (Non-Affiliated)**
- Author Share: 0 units
- UNIVEN Claim: 0 units

**Total UNIVEN Claim: 0.625 units**

## Testing Checklist

- [ ] Add multiple affiliated authors
- [ ] Add university affiliations to each author
- [ ] Mark some as "Is UNIVEN"
- [ ] Verify per-author units display correctly
- [ ] Add research company affiliations
- [ ] Verify UNIVEN + Research Company gives full unit to UNIVEN
- [ ] Check summary table shows correct breakdowns
- [ ] Add non-affiliated authors
- [ ] Verify non-affiliated authors show 0 units
- [ ] Test adding/removing affiliations dynamically
- [ ] Verify calculations update in real-time
- [ ] Test form save/load with affiliations
- [ ] Verify attachments still work
- [ ] Test stepper navigation with affiliated authors step

## Browser Console Checks

After building, verify in browser DevTools:
- No TypeScript errors
- `unitBreakdown` object properly populated when authors added
- Unit calculations recalculate on affiliation changes
- No memory leaks on add/remove operations

## Future Enhancements

1. Add predefined university list (dropdown instead of text input)
2. Add validation that at least one UNIVEN must be checked for affiliated authors
3. Add unit calculation export to PDF
4. Add unit calculation history/audit trail
5. Add bulk import of author affiliations from CSV
6. Add institution-wide configuration for research company types

