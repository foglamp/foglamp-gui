import { Component, OnInit, HostListener, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SidebarModule } from 'ng-sidebar';
import { SharedService } from './services/shared.service';
import { PingService } from './services/index';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'app';
  @ViewChild('sidebar') sidebar: SidebarModule;
  navMode = 'side';

  public _opened = true;
  returnUrl: string;
  isUserLoggedIn = false;
  skip = false;
  isLoginView = false;

  constructor(private router: Router,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef, private ping: PingService) {
    this.sharedService.isUserLoggedIn.subscribe(value => {
      this.isUserLoggedIn = value.loggedIn;
    });

    this.sharedService.isLoginSkiped.subscribe(value => {
      this.skip = value;
    });
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
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isActive(event.url);
      }
    });
    this.ping.setDefaultPingTime();
    const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
    this.ping.pingIntervalChanged.next(pingInterval);
  }

  ngAfterViewInit() {
    // get loggedin user token from session
    const token = sessionStorage.getItem('token');
    const skip = sessionStorage.getItem('login_skipped');
    if (token != null && token.trim().length > 0) {
      this.isUserLoggedIn = true;
    } else if (skip != null && skip.trim().length > 0) {
      this.skip = true;
    }
    this.cdr.detectChanges();
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
