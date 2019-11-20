import { UnsubscribeOnDestroyAdapter } from './../../../../unsubscribe-on-destroy-adapter';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AlertService, UserService, ProgressBarService } from '../../../../services';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  public userRecord: any = {};
  public userName: string;

  constructor(private alertService: AlertService,
    private userService: UserService,
    public ngProgress: ProgressBarService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super();
    // get username from url
    this.userName = this.activatedRoute.snapshot.queryParams['username'];
  }

  ngOnInit() { }

  public resetUserForm(form: NgForm) {
    form.controls['currentPassword'].reset();
    form.controls['password'].reset();
    form.controls['confirmPassword'].reset();
  }

  public resetPassword(form: NgForm) {
    const passwordPayload: any = {
      current_password: form.controls['currentPassword'].value,
      new_password: form.controls['password'].value
    };
    this.ngProgress.start();
    this.subs.sink = this.userService.changePassword(passwordPayload, this.userName).
      subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          if (form != null) {
            this.resetUserForm(form);
          }
          this.router.navigate(['/login'], { replaceUrl: true });
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}

