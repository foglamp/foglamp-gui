import { UnsubscribeOnDestroyAdapter } from './../../../unsubscribe-on-destroy-adapter';
import { Component, OnInit } from '@angular/core';
import { AlertService, SupportService, ProgressBarService, SharedService } from '../../../services';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  public bundlesData = [];
  viewPort: any = '';

  constructor(private supportBundleService: SupportService,
    public ngProgress: ProgressBarService,
    private alertService: AlertService,
    private sharedService: SharedService) {
      super();
    }

  ngOnInit() {
    this.getBundles();
    this.subs.sink = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  public getBundles() {
    this.ngProgress.start();
    this.subs.sink = this.supportBundleService.get().
      subscribe(
        (data) => {
          this.ngProgress.done();
          this.bundlesData = data['bundles'].sort().reverse();
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

  public requestNewBundle() {
    this.ngProgress.start();
    this.subs.sink = this.supportBundleService.post().
      subscribe(
        () => {
          this.ngProgress.done();
          this.alertService.success('Support bundle created successfully');
          this.getBundles();
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

  public async downloadBundle(bundle): Promise<void> {
    const blob = await this.supportBundleService.downloadSupportBundle(bundle);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    a.download = bundle;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

