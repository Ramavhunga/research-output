export interface DepartmentDeanRequest {
  deanStaffNo: string;
  deanName?: string;
}

export interface DepartmentDeanView {
  departmentId: number;
  departmentName: string;
  deanStaffNo: string;
  deanName: string;
  deanTitle: string;
  deanFirstname: string;
  deanSurname: string;
}

