import { Component, OnInit, Input, OnChanges, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { ServicesApiService, AlertService, ProgressBarService } from '../../../../services';

@Component({
  selector: 'app-south-plugin-modal',
  templateUrl: './south-plugin-modal.component.html',
  styleUrls: ['./south-plugin-modal.component.css']
})
export class SouthPluginModalComponent implements OnInit, OnChanges {

  southPlugins = [];
  config = {
    search: true,
    height: '200px',
    placeholder: 'Select',
    limitTo: this.southPlugins.length,
    moreText: 'more', // text to be displayed when more than one items are selected like Option 1 + 5 more
    noResultsFound: 'No plugin found!',
    searchPlaceholder: 'Search',
  };

  @ViewChild('pluginDropdown') el: ElementRef;

  @Input() data: {
    modalState: boolean,
    serviceType: string
  };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  selectedPlugin: string;

  constructor(private service: ServicesApiService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.data.modalState === true) {
      this.toggleModal(true);
      this.getAvailableSouthPlugins(this.data.serviceType);
    }
  }

  public toggleModal(isOpen: Boolean) {
    const modal_name = <HTMLDivElement>document.getElementById('south-service-plugin-modal');
    if (isOpen) {
      modal_name.classList.add('is-active');
      return;
    }
    modal_name.classList.remove('is-active');
  }

  selectionChanged(event: any) {
    this.selectedPlugin = event.value;
  }

  fetchPluginRequestStarted() {
     this.ngProgress.start();
     const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
     requestInProgressEle.innerHTML = 'fetching available plugins ...';
  }

  fetchPluginRequestDone() {
    this.ngProgress.done();

    if (this.southPlugins.length) {
      const ddnEle: HTMLElement = document.getElementsByClassName('ngx-dropdown-button')[0] as HTMLElement;
      ddnEle.click();
    }

    const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
    requestInProgressEle.innerHTML = '';
  }

  getAvailableSouthPlugins(serviceType: string) {
    this.fetchPluginRequestStarted();
    this.service.getAvailablePlugins(serviceType).
      subscribe(
        (data: any) => {
          const pList = [];
          data['plugins'].forEach(p => {
            pList.push(p.replace('foglamp-south-', ''));
          });
          this.southPlugins = pList;
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

  installPlugin() {
    const pluginData = {
      format: 'repository',
      name: 'foglamp-south-' + this.selectedPlugin,
      version: ''
    };

    // remove me
    console.log(pluginData);

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('installing ...', true);
    this.service.installPlugin(pluginData).
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.toggleModal(false);
          this.notify.emit(this.selectedPlugin);
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
