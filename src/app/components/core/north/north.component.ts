import { UnsubscribeOnDestroyAdapter } from './../../../unsubscribe-on-destroy-adapter';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { sortBy } from 'lodash';
import { takeWhile } from 'rxjs/operators';
import { interval } from 'rxjs';

import { AlertService, NorthService, PingService, SharedService } from '../../../services';
import { POLLING_INTERVAL } from '../../../utils';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';
import { ViewLogsComponent } from '../packages-log/view-logs/view-logs.component';

@Component({
  selector: 'app-north',
  templateUrl: './north.component.html',
  styleUrls: ['./north.component.css']
})

export class NorthComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnDestroy {
  public task: string;
  public tasks: any;
  viewPort: any = '';

  public refreshInterval = POLLING_INTERVAL;
  public showSpinner = false;
  private isAlive: boolean;

  constructor(private northService: NorthService,
    private ping: PingService,
    private alertService: AlertService,
    private router: Router,
    private sharedService: SharedService) {
    super();
    this.isAlive = true;
    this.subs.sink = this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.refreshInterval = timeInterval;
    });
    this.subs.sink = this.sharedService.showLogs.subscribe(showPackageLogs => {
      if (showPackageLogs.isSubscribed) {
        // const closeBtn = <HTMLDivElement>document.querySelector('.modal .delete');
        // if (closeBtn) {
        //   closeBtn.click();
        // }
        this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
        showPackageLogs.isSubscribed = false;
      }
    });
  }

  @ViewChild(NorthTaskModalComponent, { static: true }) northTaskModal: NorthTaskModalComponent;
  @ViewChild(ViewLogsComponent, { static: false }) viewLogsComponent: ViewLogsComponent;

  ngOnInit() {
    this.showLoadingSpinner();
    this.getNorthTasks(false);
    this.subs.sink = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive)) // only fires when component is alive
      .subscribe(() => {
        this.getNorthTasks(true);
      });
      this.subs.sink = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  addNorthInstance() {
    this.router.navigate(['/north/add']);
  }

  public getNorthTasks(caching: boolean): void {
    this.subs.sink = this.northService.getNorthTasks(caching).
      subscribe(
        (data) => {
          this.tasks = data;
          this.tasks = sortBy(this.tasks, function (obj) {
            return !obj.enabled + obj.processName.toLowerCase();
          });
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  openNorthTaskModal(task) {
    this.task = task;
    // call child component method to toggle modal
    this.northTaskModal.toggleModal(true);
  }

  onNotify() {
    this.getNorthTasks(false);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}

