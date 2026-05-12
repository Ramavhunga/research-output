import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to manage student information across the application
 * Stores student data in session storage and provides observable access
 */
@Injectable({
  providedIn: 'root'
})
export class StudentInfoService {

  private studentInfoSubject = new BehaviorSubject<any>(null);
  public studentInfo$ = this.studentInfoSubject.asObservable();

  constructor() {
    // Load student info from session storage on service initialization
    this.loadStudentInfoFromStorage();
  }

  /**
   * Load student information from session storage
   */
  private loadStudentInfoFromStorage(): void {
    try {
      const storedInfo = sessionStorage.getItem('studentInfo');
      if (storedInfo) {
        const studentInfo = JSON.parse(storedInfo);
        this.studentInfoSubject.next(studentInfo);
      }
    } catch (error) {
      console.error('Error loading student info from storage:', error);
    }
  }

  /**
   * Set student information
   * @param studentInfo Complete student information object
   */
  setStudentInfo(studentInfo: any): void {
    try {
      sessionStorage.setItem('studentInfo', JSON.stringify(studentInfo));
      this.studentInfoSubject.next(studentInfo);
    } catch (error) {
      console.error('Error setting student info:', error);
    }
  }

  /**
   * Get student information as observable
   */
  getStudentInfo$(): Observable<any> {
    return this.studentInfo$;
  }

  /**
   * Get student information synchronously
   */
  getStudentInfo(): any {
    return this.studentInfoSubject.getValue();
  }

  /**
   * Get specific property from student information
   * @param key Property name to retrieve
   * @returns Property value or null
   */
  getStudentProperty(key: string): any {
    const studentInfo = this.studentInfoSubject.getValue();
    return studentInfo ? studentInfo[key] : null;
  }

  /**
   * Clear student information (logout)
   */
  clearStudentInfo(): void {
    try {
      sessionStorage.removeItem('studentInfo');
      this.studentInfoSubject.next(null);
    } catch (error) {
      console.error('Error clearing student info:', error);
    }
  }

  /**
   * Check if student information exists
   */
  hasStudentInfo(): boolean {
    return this.studentInfoSubject.getValue() !== null;
  }
}

