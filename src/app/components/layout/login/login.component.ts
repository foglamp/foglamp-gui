import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, AuthService, UserService } from '../../../services';
import { SharedService } from '../../../services/shared.service';

@Component({
  moduleId: module.id.toString(),
  selector: 'app-login',
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  model: any = {};
  returnUrl: string;
  constructor(
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private sharedService: SharedService,
    private userService: UserService,
    public ngProgress: NgProgress) { }

  ngOnInit() {
    // clear session
    this.resetSession();
  }

  /**
   *  login user into system
   */
  login() {
    this.ngProgress.start();
    this.authService.login(this.model.username, this.model.password).
      subscribe(
        (data) => {
          this.ngProgress.done();
          sessionStorage.setItem('token', data['token']);
          sessionStorage.setItem('uid', data['uid']);
          sessionStorage.setItem('isAdmin', JSON.stringify(data['admin']));
          this.sharedService.isAdmin.next(JSON.parse(sessionStorage.getItem('isAdmin')));
          this.getUser(data['uid']);
          this.router.navigate(['']);
          this.sharedService.isUserLoggedIn.next(true);
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else if (error.status === 401) {
            if (error.statusText.toUpperCase().indexOf('PASSWORD') >= 0
              && error.statusText.toUpperCase().indexOf('EXPIRED') >= 0) {
              this.router.navigate(['/reset-password'], { queryParams: { username: this.model.username } });
            }
            this.alertService.error(error.statusText, true);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }

  public setupInstance() {
    this.router.navigate(['/setting'], { queryParams: { id: '1' } });
  }

  getUser(id) {
    // Get SignedIn user details
    this.userService.getUser(id)
      .subscribe(
        (userData) => {
          this.sharedService.isUserLoggedIn.next({
            'loggedIn': true,
            'userName': userData['userName']
          });
          sessionStorage.setItem('userName', userData['userName']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public resetSession() {
    sessionStorage.clear();
  }

  public forgotPassword() {
    this.alertService.warning('Please ask the administrator to reset your password.');
  }
}
