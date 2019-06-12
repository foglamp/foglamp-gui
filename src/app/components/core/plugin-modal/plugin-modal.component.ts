import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ServicesApiService, AlertService, ProgressBarService } from '../../../services';

@Component({
  selector: 'app-plugin-modal',
  templateUrl: './plugin-modal.component.html',
  styleUrls: ['./plugin-modal.component.css']
})
export class PluginModalComponent implements OnInit, OnChanges {

  plugins = [];
  config = {
    search: true,
    height: '200px',
    placeholder: 'Select',
    limitTo: this.plugins.length,
    moreText: 'more', // text to be displayed when more than one items are selected like Option 1 + 5 more
    noResultsFound: 'No plugin found!',
    searchPlaceholder: 'Search',
  };

  @Input() data: {
    modalState: boolean,
    serviceType: string
  };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private service: ServicesApiService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.data.modalState === true) {
      this.toggleModal(true);
      this.getAvailablePlugins(this.data.serviceType);
    }
  }

  public toggleModal(isOpen: Boolean) {
    const modal_name = <HTMLDivElement>document.getElementById('plugin-modal');
    if (isOpen) {
      modal_name.classList.add('is-active');
      return;
    }
    modal_name.classList.remove('is-active');
  }

  fetchPluginRequestStarted() {
    this.ngProgress.start();
    const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
    requestInProgressEle.innerHTML = 'fetching available plugins ...';
  }

  fetchPluginRequestDone() {
    this.ngProgress.done();

    if (this.plugins.length) {
      const ddnEle: HTMLElement = document.getElementsByClassName('ngx-dropdown-button')[0] as HTMLElement;
      ddnEle.click();
    }

    const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
    requestInProgressEle.innerHTML = '';
  }

  getAvailablePlugins(serviceType: string) {
    this.fetchPluginRequestStarted();
    this.service.getAvailablePlugins(serviceType).
      subscribe(
        (data: any) => {
          this.plugins = data['plugins'].map((p: string) => p.replace('foglamp-south-', ''));
          this.fetchPluginRequestDone();
        },
        error => {
          this.fetchPluginRequestDone();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  installPlugin(plugin: any) {
    const pluginData = {
      format: 'repository',
      name: 'foglamp-south-' + plugin.value,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('installing...', true);
    this.service.installPlugin(pluginData).
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.toggleModal(false);
          this.notify.emit(plugin.value);
          this.alertService.closeMessage();
          this.alertService.success(data.message, true);
        },
        error => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }
}
