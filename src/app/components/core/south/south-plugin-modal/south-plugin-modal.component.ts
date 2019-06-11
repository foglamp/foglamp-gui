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

  doBlah() {
    const element: HTMLElement = document.getElementsByClassName('ngx-dropdown-button')[0] as HTMLElement;
    element.click();
    const wip: HTMLElement = document.getElementById('wip') as HTMLElement;
    wip.innerHTML = '';
  }

  getAvailableSouthPlugins(serviceType: string) {
    /** request started */
    this.ngProgress.start();
    const wip: HTMLElement = document.getElementById('wip') as HTMLElement;
    wip.innerHTML = 'Fetching avaialble plugins ...';
    this.service.getAvailablePlugins(serviceType).
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.southPlugins = data['plugins'];
          this.doBlah();
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

  installPlugin() {
    const pluginData = {
      format: 'repository',
      name: this.selectedPlugin,
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
