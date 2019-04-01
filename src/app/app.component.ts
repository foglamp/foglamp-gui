import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SidebarModule } from 'ng-sidebar';

import { PingService } from './services';
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
  public returnUrl: string;
  public isLoginView = false;

  constructor(private router: Router,
    private ping: PingService,
    private sharedService: SharedService) { }

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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.onLaunchAppRedirect();
      }
    });
    this.setPingIntervalOnAppLaunch();
    this.setStasHistoryGraphRefreshIntervalOnAppLaunch();
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

  onLaunchAppRedirect() {
    this.sharedService.isServiceUp.subscribe(isServiceUp => {
      if (isServiceUp) {
        if (sessionStorage.getItem('token') === null
          && !JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))) {
          this.isLoginView = true;
          this.router.navigate(['/login']);
        } else {
          this.isLoginView = false;
          if (location.href.includes('/setting?id=1')) {
            this.router.navigate(['']);
          }
        }
      } else {
        this.isLoginView = true;
        this.router.navigate(['/setting'], { queryParams: { id: '1' } });
      }
    });
  }

  setPingIntervalOnAppLaunch() {
    this.ping.setDefaultPingTime();
    const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
    this.ping.pingIntervalChanged.next(pingInterval);
  }

  setStasHistoryGraphRefreshIntervalOnAppLaunch() {
    this.ping.setDefaultRefreshGraphTime();
    const refreshInterval = JSON.parse(localStorage.getItem('DASHBOARD_GRAPH_REFRESH_INTERVAL'));
    this.ping.refreshIntervalChanged.next(refreshInterval);
  }
}

