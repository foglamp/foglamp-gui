import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { UserManagementComponent } from '.';
import { UserGuard } from '../../../guards';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CreateUserComponent } from './create-user/create-user.component';
import { UpdateUserComponent } from './update-user/update-user.component';

const routes: Routes = [
  {
    path: '',
    component: UserManagementComponent,
    canActivate: [UserGuard]
  }
];

@NgModule({
  declarations: [
    UserManagementComponent,
    UpdateUserComponent,
    CreateUserComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    AlertDialogModule
  ],
  providers: [UserGuard],
  exports: []
})
export class UserManagementModule {}
