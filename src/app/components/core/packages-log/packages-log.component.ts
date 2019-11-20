import { UnsubscribeOnDestroyAdapter } from './../../../unsubscribe-on-destroy-adapter';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertService, PackagesLogService, ProgressBarService } from '../../../services';
import { sortBy } from 'lodash';
import { ViewLogsComponent } from './view-logs/view-logs.component';

@Component({
  selector: 'app-packages-log',
  templateUrl: './packages-log.component.html',
  styleUrls: ['./packages-log.component.css']
})
export class PackagesLogComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  public logList = [];

  @ViewChild(ViewLogsComponent, { static: false }) viewLogsModal: ViewLogsComponent;

  constructor(private packagesLogService: PackagesLogService,
    private ngProgress: ProgressBarService,
    private alertService: AlertService) {
      super();
    }

  ngOnInit() {
    this.getPackagesLog();
  }

  public getPackagesLog() {
    /** request start */
    this.ngProgress.start();
    this.subs.sink = this.packagesLogService.getPackageLogs().
    subscribe(
      (data) => {
        this.ngProgress.done();
        this.logList = sortBy(data['logs'], (obj) => obj.timestamp).reverse();
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

  public async downloadLogs(logLink: string): Promise<void> {
    const blob = await this.packagesLogService.getLog(logLink);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    a.download = logLink;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * toggle view logs modal and pass info
   * @param logLink link of the log to show
   */
  public showLogs(logLink: string) {
    this.viewLogsModal.toggleModal(true, logLink);
  }

  /**
   * Reload package log list
   * @param notify
   */
  onNotify() {
    this.getPackagesLog();
  }

}
