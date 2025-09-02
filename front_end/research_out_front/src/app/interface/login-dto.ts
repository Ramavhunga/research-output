import {User} from './user';
import {Staff} from './staff';
import {Student} from './student';
import {Communication} from './communication';

export interface LoginDTO {
  user : User;
  staff: Staff;
  student:Student;
  communication : Communication;
}
