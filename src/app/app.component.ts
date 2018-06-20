import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SidebarModule } from 'ng-sidebar';

import { PingService, ServicesHealthService } from './services';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  @ViewChild('sidebar') sidebar: SidebarModule;
  navMode = 'side';

  public _opened = true;
  returnUrl: string;
  isLoginView = false;

  constructor(private router: Router,
    private ping: PingService,
    private servicesHealthService: ServicesHealthService,
    private sharedService: SharedService) {
    this.servicesHealthService.pingService()
      .subscribe(
        (data) => {
          sessionStorage.setItem('LOGIN_SKIPPED', JSON.stringify(data['authenticationOptional']));
          if (JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED')) === true) {
            this.router.navigate(['']);
          } else if (JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED')) === false && sessionStorage.getItem('token') === null) {
            this.router.navigate(['/login']);
          }
        },
        (error) => {
          console.log('error: ', error);
        },
    );
  }

  public toggleSidebar() {
    if (this.navMode === 'over') {
      this._opened = !this._opened;
    }
  }

  ngOnInit() {
    if (window.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
    this.ping.setDefaultPingTime();
    const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
    this.ping.pingIntervalChanged.next(pingInterval);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isActive(event.url);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
    if (event.target.innerWidth >= 1024) {
      this.navMode = 'side';
      this._opened = true;
    }
  }

  isActive(href) {
    if (href === '/login' || href === '/setting?id=1' || href.indexOf('reset-password') >= 0) {
      return this.isLoginView = true;
    } else {
      return this.isLoginView = false;
    }
  }
}
