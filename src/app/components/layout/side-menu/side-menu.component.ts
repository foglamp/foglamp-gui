import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

import { SharedService } from '../../../services/shared.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  public step = '';
  public location = '';
  @Output() toggle: EventEmitter<any> = new EventEmitter();

  isAdmin = false;
  constructor(private router: Router, private sharedService: SharedService) { }
  ngOnInit() {
    this.sharedService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });
    this.router.events.subscribe(() => {
      if (this.router.url === '/' || this.router.url === '/dashboard') {
        this.step = '/dashboard';
      } else {
        this.step = this.router.url;
      }
    });
  }

  onRightClick(clickedLink) {
    this.location = clickedLink;
    // Right click on menu item, get data in localStorage from sessionStorage
    const storageItems = ['token', 'uid', 'isAdmin', 'userName'];
    if (sessionStorage.getItem('token')) {
      for (const s of storageItems) {
        localStorage.setItem(s, sessionStorage.getItem(s));
      }
    }
  }

  onToggle(step) {
    this.step = step;
    this.router.navigate([step]);
    this.toggle.emit();
  }
}
