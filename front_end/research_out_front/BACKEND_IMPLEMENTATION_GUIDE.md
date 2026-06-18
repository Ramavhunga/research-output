# Department Dean Assignment - Backend Implementation Guide

## Overview

This guide provides the backend implementation requirements for persisting department dean assignments.

## Current Frontend State

The frontend component is currently using a **simulated success** for assignment since the backend endpoint doesn't exist yet. The line is at `department-dean-assignment-component.ts` (~line 127-136).

## Required Backend Implementation

### 1. Entity Model Enhancement

#### Update: `Department.java`
```java
package za.co.univen.research_output.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String code;
    
    @Column(nullable = false)
    private String name;
    
    @ManyToOne
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;
    
    // NEW FIELD: Dean relationship
    @ManyToOne
    @JoinColumn(name = "dean_id", nullable = true)
    private Staff dean;
    
    // NEW FIELD: Audit fields
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 2. DTO for Assignment Request/Response

#### New File: `DepartmentDeanAssignmentRequest.java`
```java
package za.co.univen.research_output.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDeanAssignmentRequest {
    private String deanStaffNo;
}
```

#### New File: `DepartmentDeanResponse.java`
```java
package za.co.univen.research_output.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDeanResponse {
    private Long departmentId;
    private String departmentName;
    private String departmentCode;
    private String deanStaffNo;
    private String deanTitle;
    private String deanFirstname;
    private String deanSurname;
    private LocalDateTime assignedAt;
    private String message;
}
```

### 3. Service Implementation

#### New File or Update: `DepartmentService.java`
```java
package za.co.univen.research_output.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.univen.research_output.dto.DepartmentDeanAssignmentRequest;
import za.co.univen.research_output.dto.DepartmentDeanResponse;
import za.co.univen.research_output.entities.Department;
import za.co.univen.research_output.entities.Staff;
import za.co.univen.research_output.repositories.DepartmentRepository;
import za.co.univen.research_output.repositories.StaffRepository;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Slf4j
public class DepartmentService {
    
    private final DepartmentRepository departmentRepository;
    private final StaffRepository staffRepository;
    
    public DepartmentService(
        DepartmentRepository departmentRepository,
        StaffRepository staffRepository
    ) {
        this.departmentRepository = departmentRepository;
        this.staffRepository = staffRepository;
    }
    
    /**
     * Assign a staff member as dean to a department
     */
    @Transactional
    public DepartmentDeanResponse assignDeanToDepartment(
        Long departmentId,
        DepartmentDeanAssignmentRequest request
    ) throws Exception {
        
        log.info("Assigning dean {} to department {}", 
            request.getDeanStaffNo(), departmentId);
        
        // Find the department
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Department not found: " + departmentId));
        
        // Find the staff member
        Optional<Staff> staffOptional = staffRepository
            .findByPersonNumber(request.getDeanStaffNo());
        
        if (staffOptional.isEmpty()) {
            throw new IllegalArgumentException(
                "Staff not found: " + request.getDeanStaffNo());
        }
        
        Staff dean = staffOptional.get();
        
        // Check if staff belongs to the same faculty (optional business rule)
        if (!dean.getDepartment().getFaculty().getId()
            .equals(department.getFaculty().getId())) {
            log.warn("Staff {} does not belong to faculty {}", 
                dean.getPersonNumber(), department.getFaculty().getId());
            // Optionally throw exception or just warn
        }
        
        // Update department with new dean
        department.setDean(dean);
        department.setUpdatedAt(LocalDateTime.now());
        
        // Save and return response
        Department savedDepartment = departmentRepository.save(department);
        
        log.info("Successfully assigned dean {} to department {}", 
            dean.getPersonNumber(), department.getName());
        
        return new DepartmentDeanResponse(
            savedDepartment.getId(),
            savedDepartment.getName(),
            savedDepartment.getCode(),
            dean.getPersonNumber(),
            dean.getTitle(),
            dean.getFirstname(),
            dean.getSurname(),
            LocalDateTime.now(),
            "Dean assigned successfully"
        );
    }
    
    /**
     * Remove dean from a department
     */
    @Transactional
    public DepartmentDeanResponse removeDeanFromDepartment(Long departmentId)
        throws Exception {
        
        log.info("Removing dean from department {}", departmentId);
        
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Department not found: " + departmentId));
        
        String removedDeanName = department.getDean() != null 
            ? department.getDean().getPersonNumber() 
            : "None";
        
        department.setDean(null);
        department.setUpdatedAt(LocalDateTime.now());
        
        departmentRepository.save(department);
        
        log.info("Successfully removed dean {} from department {}", 
            removedDeanName, department.getName());
        
        return new DepartmentDeanResponse(
            department.getId(),
            department.getName(),
            department.getCode(),
            null,
            null,
            null,
            null,
            LocalDateTime.now(),
            "Dean removed successfully"
        );
    }
    
    /**
     * Get current dean of a department
     */
    public DepartmentDeanResponse getDeanOfDepartment(Long departmentId)
        throws Exception {
        
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Department not found: " + departmentId));
        
        if (department.getDean() == null) {
            return new DepartmentDeanResponse(
                department.getId(),
                department.getName(),
                department.getCode(),
                null,
                null,
                null,
                null,
                null,
                "No dean assigned"
            );
        }
        
        Staff dean = department.getDean();
        return new DepartmentDeanResponse(
            department.getId(),
            department.getName(),
            department.getCode(),
            dean.getPersonNumber(),
            dean.getTitle(),
            dean.getFirstname(),
            dean.getSurname(),
            department.getUpdatedAt(),
            "Dean information retrieved"
        );
    }
}
```

### 4. Controller Implementation

#### Update: `FacultyDepartmentController.java`
```java
package za.co.univen.research_output.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.univen.research_output.dto.DepartmentDeanAssignmentRequest;
import za.co.univen.research_output.dto.DepartmentDeanResponse;
import za.co.univen.research_output.entities.Department;
import za.co.univen.research_output.entities.Faculty;
import za.co.univen.research_output.repositories.DepartmentRepository;
import za.co.univen.research_output.repositories.FacultyRepository;
import za.co.univen.research_output.services.DepartmentService;

import java.util.List;

@RestController
@RequestMapping("/api/facultydepartment")
@CrossOrigin("*")
@Slf4j
public class FacultyDepartmentController {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentService departmentService;

    public FacultyDepartmentController(
        FacultyRepository facultyRepository,
        DepartmentRepository departmentRepository,
        DepartmentService departmentService
    ) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.departmentService = departmentService;
    }

    @GetMapping("/faculties")
    public ResponseEntity<List<Faculty>> getAllFaculties() {
        return ResponseEntity.ok(facultyRepository.findAll());
    }

    @GetMapping("/faculties/{facultyId}/departments")
    public ResponseEntity<List<Department>> getByFaculty(
        @PathVariable Long facultyId
    ) {
        return ResponseEntity.ok(departmentRepository.findDepartmentByFacultyId(facultyId));
    }
    
    /**
     * NEW ENDPOINT: Assign dean to department
     */
    @PostMapping("/department/{departmentId}/dean")
    public ResponseEntity<?> assignDeanToDepartment(
        @PathVariable Long departmentId,
        @RequestBody DepartmentDeanAssignmentRequest request
    ) {
        try {
            log.info("Endpoint called: Assign dean to department {}", departmentId);
            DepartmentDeanResponse response = departmentService
                .assignDeanToDepartment(departmentId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new ErrorResponse(e.getMessage())
            );
        } catch (Exception e) {
            log.error("Error assigning dean", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to assign dean: " + e.getMessage()));
        }
    }
    
    /**
     * NEW ENDPOINT: Remove dean from department
     */
    @DeleteMapping("/department/{departmentId}/dean")
    public ResponseEntity<?> removeDeanFromDepartment(
        @PathVariable Long departmentId
    ) {
        try {
            log.info("Endpoint called: Remove dean from department {}", departmentId);
            DepartmentDeanResponse response = departmentService
                .removeDeanFromDepartment(departmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error removing dean", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to remove dean: " + e.getMessage()));
        }
    }
    
    /**
     * NEW ENDPOINT: Get current dean of department
     */
    @GetMapping("/department/{departmentId}/dean")
    public ResponseEntity<?> getDeanOfDepartment(
        @PathVariable Long departmentId
    ) {
        try {
            log.info("Endpoint called: Get dean of department {}", departmentId);
            DepartmentDeanResponse response = departmentService
                .getDeanOfDepartment(departmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error retrieving dean", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to retrieve dean: " + e.getMessage()));
        }
    }
    
    // Inner class for error responses
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ErrorResponse {
        private String error;
        private String message = "An error occurred";
        
        public ErrorResponse(String message) {
            this.message = message;
            this.error = "Error";
        }
    }
}
```

### 5. Repository Update

#### Update: `DepartmentRepository.java`
```java
package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.Department;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findDepartmentByFacultyId(Long facultyId);
    
    // NEW: Find departments with a specific dean
    List<Department> findByDeanPersonNumber(String personNumber);
    
    // NEW: Find department by name and faculty
    Optional<Department> findByNameAndFacultyId(String name, Long facultyId);
}
```

### 6. Database Migration

#### SQL Migration Script
```sql
-- Add dean_id column to departments table (if not exists)
ALTER TABLE departments ADD COLUMN dean_id BIGINT;

-- Add foreign key constraint
ALTER TABLE departments 
ADD CONSTRAINT fk_department_dean 
FOREIGN KEY (dean_id) REFERENCES staff(id) ON DELETE SET NULL;

-- Add audit columns
ALTER TABLE departments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE departments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create index for faster queries
CREATE INDEX idx_department_dean ON departments(dean_id);
```

#### Liquibase (Recommended)
Create: `db/changelog/2026-06-09-add-dean-to-department.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.1.xsd">

    <changeSet id="add-dean-to-department-1" author="system">
        <addColumn tableName="departments">
            <column name="dean_id" type="BIGINT"/>
        </addColumn>
        <addForeignKeyConstraint
            constraintName="fk_department_dean"
            baseTableName="departments"
            baseColumnNames="dean_id"
            referencedTableName="staff"
            referencedColumnNames="id"
            onDelete="SET NULL"/>
    </changeSet>

    <changeSet id="add-audit-columns-department" author="system">
        <addColumn tableName="departments">
            <column name="created_at" type="TIMESTAMP" defaultValueDate="NOW()"/>
            <column name="updated_at" type="TIMESTAMP" defaultValueDate="NOW()"/>
        </addColumn>
    </changeSet>

</databaseChangeLog>
```

## 7. Update Frontend Service

#### Update: `department-dean-assignment-component.ts` (line ~130)
```typescript
assignDean(): void {
    // ... validation code ...

    const selectedDept = this.departments.find(d => d.id === this.selectedDepartmentId);
    const fullName = `${this.selectedStaff.title || ''} ${this.selectedStaff.firstname || ''} ${this.selectedStaff.surname || ''}`
      .trim();
    const deptName = selectedDept?.name || 'Unknown';

    Swal.fire({
      title: 'Assign Dean?',
      html: `<p>Assign <strong>${fullName}</strong> as Dean of <strong>${deptName}</strong>?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, assign',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.saving = true;
      
      // CALL ACTUAL API ENDPOINT
      const request: DepartmentDeanAssignmentRequest = {
        staffNo: this.selectedStaff!.staffNo
      };
      
      this.departmentDeanService.assignDeanToDepartment(
        this.selectedDepartmentId!,
        request
      ).subscribe({
        next: (response) => {
          this.saving = false;
          Swal.fire(
            'Success',
            `${fullName} has been assigned as Dean of ${deptName}.`,
            'success'
          );
          this.resetForm();
        },
        error: (err) => {
          this.saving = false;
          console.error('Failed to assign dean', err);
          Swal.fire('Error', 'Failed to assign dean. Please try again.', 'error');
        }
      });
    });
  }
```

### 8. Frontend Service Enhancement

#### Add method to `faculty-department.service.ts`:
```typescript
assignDeanToDepartment(
  departmentId: number,
  request: DepartmentDeanAssignmentRequest
): Observable<DepartmentDeanResponse> {
  return this.http.post<DepartmentDeanResponse>(
    `${this.baseUrl}api/facultydepartment/department/${departmentId}/dean`,
    request
  );
}

removeDeanFromDepartment(departmentId: number): Observable<DepartmentDeanResponse> {
  return this.http.delete<DepartmentDeanResponse>(
    `${this.baseUrl}api/facultydepartment/department/${departmentId}/dean`
  );
}

getDeanOfDepartment(departmentId: number): Observable<DepartmentDeanResponse> {
  return this.http.get<DepartmentDeanResponse>(
    `${this.baseUrl}api/facultydepartment/department/${departmentId}/dean`
  );
}
```

## Implementation Checklist

- [ ] Update Department entity with dean field
- [ ] Create DTOs (Request/Response)
- [ ] Create DepartmentService with business logic
- [ ] Update FacultyDepartmentController with new endpoints
- [ ] Update DepartmentRepository with new queries
- [ ] Create database migration scripts
- [ ] Create database backup before migration
- [ ] Run database migrations
- [ ] Update frontend service with new methods
- [ ] Update component with API call
- [ ] Add error handling
- [ ] Write unit tests for service
- [ ] Write integration tests for controller
- [ ] Test all scenarios end-to-end
- [ ] Document API endpoints
- [ ] Update Swagger/OpenAPI docs
- [ ] Review security considerations
- [ ] Get code review approval
- [ ] Deploy to staging
- [ ] Test in staging environment
- [ ] Deploy to production

## Testing Scenarios

### Test 1: Successful Assignment
- Assign valid staff to valid department
- Verify database update
- Verify API response
- Verify frontend success message

### Test 2: Invalid Department
- Attempt assignment with non-existent department
- Verify error handling
- Verify error message shown to user

### Test 3: Invalid Staff
- Attempt assignment with non-existent staff
- Verify error handling
- Verify error message shown to user

### Test 4: Remove Dean
- Successfully remove dean from department
- Verify dean_id set to NULL
- Verify updated_at timestamp changed

### Test 5: Concurrent Assignments
- Assign dean to multiple departments
- Verify each assignment successful
- Verify data integrity

## Performance Considerations

1. **Indexes**: Add index on `dean_id` for faster queries
2. **N+1 Query**: Lazy load dean relationship when needed
3. **Caching**: Consider caching dean assignments per department

## Versioning

**API Version**: v1
**Base Path**: `/api/facultydepartment`
**Format**: JSON

---

**Status**: Pending Implementation
**Priority**: High
**Estimated Effort**: 4-6 hours

