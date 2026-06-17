import { Injectable } from '@angular/core';
import { Journal } from '../models/journal.model';

/**
 * Service to handle journal editing permissions based on user role and journal status
 *
 * Rules:
 * - Requestor can edit when status is REJECTED (REJECTED_L1 or REJECTED_L2)
 * - Admin, Reviewer Level 1, and Reviewer Level 2 can edit
 * - No one can edit when status is READY_FOR_POSTING or POSTED_TO_DHET
 */
@Injectable({
  providedIn: 'root'
})
export class JournalPermissionService {

  constructor() { }

  /**
   * Get current user from sessionStorage
   */
  private getCurrentUser(): { username: string; roles: string[] } | null {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      return null;
    }

    try {
      const loginData = JSON.parse(loginRaw);
      const username = (loginData?.user?.username ?? loginData?.username ?? '').toString().trim();
      const roles = (loginData?.user?.roles ?? []).map((r: any) => String(r).toUpperCase());
      return { username, roles };
    } catch {
      return null;
    }
  }

  /**
   * Get submitter (requestor) username from journal
   */
  private getSubmittedByUsername(journal: Journal): string {
    const submittedBy = (journal?.submittedBy?.username ?? '').toString().trim();
    return submittedBy;
  }

  /**
   * Normalize status to uppercase for comparison
   */
  private normalizeStatus(status: string | undefined): string {
    return (status ?? '').toUpperCase().trim();
  }

  /**
   * Check if user has admin/approver role
   */
  private isApprover(roles: string[]): boolean {
    const approverRoles = ['ADMIN', 'REVIEWER_LEVEL_1', 'REVIEWER_LEVEL_2', 'LEVEL_1_APPROVER', 'LEVEL_2_APPROVER', 'ADMINISTRATOR'];
    return roles.some(role => approverRoles.includes(role));
  }

  /**
   * Check if status is a rejected status
   */
  private isRejectedStatus(status: string): boolean {
    const rejectedStatuses = ['REJECTED', 'REJECTED_L1', 'REJECTED_L2'];
    return rejectedStatuses.includes(status);
  }

  /**
   * Check if status is locked (read-only)
   */
  private isLockedStatus(status: string): boolean {
    const lockedStatuses = ['READY_FOR_POSTING', 'POSTED_TO_DHET'];
    return lockedStatuses.includes(status);
  }

  /**
   * Determine if a journal can be edited by the current user
   *
   * Returns an object with:
   * - canEdit: boolean - whether editing is allowed
   * - reason: string - explanation of why editing is/isn't allowed
   */
  canEditJournal(journal: Journal): { canEdit: boolean; reason: string } {
    const currentUser = this.getCurrentUser();

    // Not logged in
    if (!currentUser) {
      return { canEdit: false, reason: 'You must be logged in to edit journals.' };
    }

    const { username, roles } = currentUser;
    const status = this.normalizeStatus(journal.status);
    const submittedBy = this.getSubmittedByUsername(journal);

    // Check if status is locked
    if (this.isLockedStatus(status)) {
      return {
        canEdit: false,
        reason: `Journal cannot be edited when status is "${journal.status}". It is locked for editing.`
      };
    }

    // Check if user is an approver (Admin, Level 1 Approver, Level 2 Approver)
    if (this.isApprover(roles)) {
      return this.canApproverEditAtStage(roles, status);
    }

    // Check if user is the requestor (submitter)
    if (username && submittedBy && username.toLowerCase() === submittedBy.toLowerCase()) {
      // Requestor can only edit if status is rejected
      if (this.isRejectedStatus(status)) {
        return {
          canEdit: true,
          reason: 'You can edit this journal because it was rejected and you are the requestor.'
        };
      } else {
        return {
          canEdit: false,
          reason: `As the requestor, you can only edit rejected journals. Current status is "${journal.status}".`
        };
      }
    }

    // User is neither requestor nor approver
    return {
      canEdit: false,
      reason: 'You do not have permission to edit this journal.'
    };
  }

  /**
   * Check if journal is in read-only view mode (for display purposes)
   */
  shouldShowReadOnlyMessage(journal: Journal): { show: boolean; message: string } {
    const status = this.normalizeStatus(journal.status);

    if (this.isLockedStatus(status)) {
      return {
        show: true,
        message: `This journal is in "${journal.status}" status and cannot be edited.`
      };
    }

    return { show: false, message: '' };
  }

  /**
   * Get all status values that allow editing for requestor
   */
  getEditableStatusesForRequestor(): string[] {
    return ['REJECTED', 'REJECTED_L1', 'REJECTED_L2'];
  }

  /**
   * Get all status values that lock journal from editing
   */
  getLockedStatuses(): string[] {
    return ['READY_FOR_POSTING', 'POSTED_TO_DHET'];
  }

  /**
   * Get roles that can always edit journals
   */
  getApproverRoles(): string[] {
    return ['ADMIN', 'REVIEWER_LEVEL_1', 'REVIEWER_LEVEL_2', 'LEVEL_1_APPROVER', 'LEVEL_2_APPROVER', 'ADMINISTRATOR'];
  }

  private canApproverEditAtStage(roles: string[], status: string): { canEdit: boolean; reason: string } {
    const isAdmin = roles.includes('ADMIN') || roles.includes('ADMINISTRATOR');
    if (isAdmin) {
      return { canEdit: true, reason: 'Admin can edit this journal at the current stage.' };
    }

    const hasL1 = roles.includes('REVIEWER_LEVEL_1') || roles.includes('LEVEL_1_APPROVER');
    const hasL2 = roles.includes('REVIEWER_LEVEL_2') || roles.includes('LEVEL_2_APPROVER');

    const l1Stage = status === 'SUBMITTED' || status === 'UNDER_REVIEW_L1';
    const l2Stage = status === 'UNDER_REVIEW_L2';

    if (hasL1 && l1Stage) {
      return { canEdit: true, reason: 'Level 1 reviewer can edit journals assigned to Level 1 stage.' };
    }

    if (hasL2 && l2Stage) {
      return { canEdit: true, reason: 'Level 2 reviewer can edit journals assigned to Level 2 stage.' };
    }

    return {
      canEdit: false,
      reason: `You can only edit journals assigned to your review level. Current status is "${status || 'UNKNOWN'}".`
    };
  }
}
