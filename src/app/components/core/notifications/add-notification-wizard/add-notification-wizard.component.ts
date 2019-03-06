import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { assign, cloneDeep, reduce, sortBy, map } from 'lodash';

import { NotificationsService, ProgressBarService, AlertService, ServicesHealthService } from '../../../../services/index';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';


@Component({
  selector: 'app-add-notification-wizard',
  templateUrl: './add-notification-wizard.component.html',
  styleUrls: ['./add-notification-wizard.component.css']
})
export class AddNotificationWizardComponent implements OnInit {

  public notificationRulePlugins = [];
  public notificationDeliveryPlugins = [];
  public notificationTypeList = [];

  public isValidName = true;
  public isValidPlugin = true;
  public isSinglePlugin = true;

  public payload: any;
  public rulePluginConfigurationData: any;
  public useProxy: string;

  notificationForm = new FormGroup({
    name: new FormControl(),
    rulePlugin: new FormControl(),
    notificationType: new FormControl()
  });

  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;

  constructor(private formBuilder: FormBuilder,
    private notificationService: NotificationsService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private servicesHealthService: ServicesHealthService,
    private router: Router) { }

  ngOnInit() {
    this.getNotificationPlugins();
    this.getNotificationTypeList();
    this.notificationForm = this.formBuilder.group({
      name: ['', Validators.required],
      rulePlugin: ['', Validators.required],
      notificationType: ['', Validators.required],
    });
  }

  getNotificationPlugins() {
    /** request started */
    this.ngProgress.start();
    this.notificationService.getNotificationPlugins().subscribe(
      (data: any) => {
        console.log('data', data);
        /** request completed */
        this.ngProgress.done();
        this.notificationRulePlugins = sortBy(data.rules, p => {
          return p.name.toLowerCase();
        });
        this.notificationDeliveryPlugins = sortBy(data.delivery, p => {
          return p.name.toLowerCase();
        });

        console.log('this.notificationRulePlugins', this.notificationRulePlugins);
        console.log('this.notificationDeliveryPlugins', this.notificationDeliveryPlugins);
      },
      (error) => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = last.getAttribute('id');
    console.log('previous id', id);

    if (+id === 1) {
      this.router.navigate(['/south']);
      return;
    }
    last.classList.remove('is-active');
    const sId = +id - 1;
    const previous = <HTMLElement>document.getElementById('' + sId);
    previous.setAttribute('class', 'step-item is-active');

    const stepContent = <HTMLElement>document.getElementById('c-' + id);
    if (stepContent != null) {
      stepContent.classList.remove('is-active');
    }

    const nextContent = <HTMLElement>document.getElementById('c-' + sId);
    if (nextContent != null) {
      nextContent.setAttribute('class', 'box step-content  is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 2:
        console.log('previous', id);
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
        nxtButton.disabled = false;
        break;
      case 3:
        console.log('previous', id);
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
        nxtButton.disabled = false;
        break;
      case 4:
        console.log('previous', id);
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      default:
        break;
    }
  }

  moveNext() {
    this.isValidName = true;
    const formValues = this.notificationForm.value;
    const first = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = first.getAttribute('id');
    console.log('next id', id);
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 1:
        console.log('case 1', id);
        if (formValues['name'].trim() === '') {
          this.isValidName = false;
          return;
        }
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';

        // To verify if service with given name already exist
        const isServiceNameExist = false;
        // this.schedulesName.some(item => {
        //   return formValues['name'].trim() === item.name;
        // });
        if (isServiceNameExist) {
          this.alertService.error('A south service or north task instance already exists with this name.');
          return false;
        }

        // create payload to pass in add service
        if (formValues['name'].trim() !== '') {
          this.payload = {
            name: formValues['name']
          };
        }
        break;
      case 2:
        console.log('case 2', id);
        // create payload to pass in add service
        if (formValues['rulePlugin'].length > 0) {
          this.payload.rulePlugin = formValues['rulePlugin'][0];
        }
        this.getRulePluginConfiguration();
        nxtButton.textContent = 'Save and Exit';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        this.viewConfigItemComponent.callFromWizard();
        document.getElementById('vci-proxy').click();
        if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
          return false;
        }
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 4:
        console.log('case 3', id);
        this.addNotificationService(this.payload);
        break;
      default:
        break;
    }

    if (+id >= 4) {
      return false;
    }

    first.classList.remove('is-active');
    first.classList.add('is-completed');
    const sId = +id + 1;
    const next = <HTMLElement>document.getElementById('' + sId);
    if (next != null) {
      next.setAttribute('class', 'step-item is-active');
    }

    const stepContent = <HTMLElement>document.getElementById('c-' + id);
    if (stepContent != null) {
      stepContent.classList.remove('is-active');
    }

    const nextContent = <HTMLElement>document.getElementById('c-' + sId);
    if (nextContent != null) {
      nextContent.setAttribute('class', 'box step-content is-active');
    }
  }

  /**
  *  Get default configuration of a selected plugin
  */
  private getRulePluginConfiguration(): void {
    const config = this.notificationRulePlugins.map(p => {
      console.log('p', p, this.payload.rulePlugin);
      if (p.name === this.payload.rulePlugin) {
        return p.config;
      }
    }).filter(value => value !== undefined);

    // array to hold data to display on configuration page
    this.rulePluginConfigurationData = { value: config };
    console.log('this.rulePluginConfigurationData', this.rulePluginConfigurationData);
    this.useProxy = 'true';
  }

  validateNotificationName(event: any) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getRulePluginChangedConfig(changedConfig: any) {
    const defaultConfig = map(this.rulePluginConfigurationData.value[0], (v, key) => ({ key, ...v }));
    // make a copy of matched config items having changed values
    const matchedConfig = defaultConfig.filter(e1 => {
      return changedConfig.some(e2 => {
        return e1.key === e2.key;
      });
    });

    // make a deep clone copy of matchedConfig array to remove extra keys(not required in payload)
    const matchedConfigCopy = cloneDeep(matchedConfig);
    /**
     * merge new configuration with old configuration,
     * where value key hold changed data in config object
    */
    matchedConfigCopy.forEach(e => {
      changedConfig.forEach(c => {
        if (e.key === c.key) {
          e.value = c.value.toString();
        }
      });
    });

    // final array to hold changed configuration
    let finalConfig = [];
    matchedConfigCopy.forEach(item => {
      finalConfig.push({
        [item.key]: item.type === 'JSON' ? { value: JSON.parse(item.value) } : { value: item.value }
      });
    });

    // convert finalConfig array in object of objects to pass in add service
    finalConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    this.payload.config = finalConfig;
    console.log('payload', this.payload);
  }

  getNotificationTypeList() {
    this.notificationTypeList = this.notificationService.getNotificationTypeList();
    console.log('notificationTypeList', this.notificationTypeList);
    // .subscribe(
    //   (data: []) => {
    //     console.log('data', data);
    //     this.notificationTypeList = data;
    //   },
    //   (error) => {
    //     if (error.status === 0) {
    //       console.log('service down ', error);
    //     } else {
    //       this.alertService.error(error.statusText);
    //     }
    //   });
  }

  /**
   * Method to add service
   * @param payload  to pass in request
   * @param nxtButton button to go next
   * @param previousButton button to go previous
   */
  public addNotificationService(payload: any) {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.addService(payload)
      .subscribe(
        () => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success('Notification service added successfully.', true);
          this.router.navigate(['/notification']);
        },
        (error) => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
