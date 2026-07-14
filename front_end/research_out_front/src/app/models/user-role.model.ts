export interface UserRoleView {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface UserRoleAssignmentRequest {
  roles: string[];
  itsUsername?: string;
  itsPassword?: string;
}

export interface StaffRoleView {
  staffNo: string;
  title: string;
  firstname: string;
  surname: string;
  initials: string;
  departmentName: string;
  faculty: string;
  roles: string[];
}

