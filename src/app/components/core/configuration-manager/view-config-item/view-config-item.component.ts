import {
  Component, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, ViewChild, ElementRef, ChangeDetectorRef,
  AfterViewChecked, OnDestroy} from '@angular/core';
import { NgForm } from '@angular/forms';
import { differenceWith, sortBy, isEqual, isEmpty, cloneDeep, has } from 'lodash';
import { Subscription } from 'rxjs';

import { AlertService, ConfigurationService, ProgressBarService, SharedService } from '../../../../services';
import ConfigTypeValidation from '../configuration-type-validation';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/json-lint';

@Component({
  selector: 'app-view-config-item',
  templateUrl: './view-config-item.component.html',
  styleUrls: ['./view-config-item.component.css']
})
export class ViewConfigItemComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  @Input() categoryConfigurationData: any;
  @Input() useProxy = 'false';
  @Input() useFilterProxy = 'false';
  @Input() useRuleProxy = 'false';
  @Input() useDeliveryProxy = 'false';
  @Input() formId = '';
  @Input() pageId = 'page';
  @Output() onConfigChanged: EventEmitter<any> = new EventEmitter<any>();

  public categoryConfiguration;
  public configItems = [];
  public isValidForm: boolean;
  public isWizardCall = false;
  public filesToUpload = [];
  public hasEditableConfigItems = true;
  public fileContent = '';
  public oldFileName = '';
  public newFileName = '';
  public isFileUploaded = false;
  public isValidJson = true;
  public selectedTheme = 'default';
  public isValidExtension = true;
  private subscription: Subscription;

  @ViewChild('codeeditor', { static: false }) codeeditor: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;
  @ViewChild('jsoneditor', { static: false }) jsoneditor: ElementRef;

  public passwordOnChangeFired = false;
  public passwordMatched = true;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private cdRef: ChangeDetectorRef,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.subscription = this.sharedService.theme.subscribe(theme => {
      if (theme === 'dark') {
        this.selectedTheme = 'darcula';
      }
    });
   }

  ngAfterViewChecked() {
    if (this.fileInput !== undefined) {
      if (this.fileInput.nativeElement.value === '') {
        this.newFileName = '';
      }
    }
    this.cdRef.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filesToUpload = [];
    this.configItems = [];
    this.fileContent = '';
    if (changes.categoryConfigurationData) {
      const categoryConfigurationCurrentData = cloneDeep(changes.categoryConfigurationData.currentValue);
      if (categoryConfigurationCurrentData !== undefined) {
        let configAttributes = [];
        if (categoryConfigurationCurrentData.length !== 0) {
          const currentConfigValues = categoryConfigurationCurrentData.value[0];
          configAttributes = Object.keys(currentConfigValues).map(key => {
            const element = currentConfigValues[key];
            element.key = key;
            return element;
          });

          configAttributes = sortBy(configAttributes, function (ca) {
            return parseInt(ca.order, 10);
          });

          categoryConfigurationCurrentData.value = configAttributes;
          this.categoryConfiguration = categoryConfigurationCurrentData;
          this.configItems = configAttributes.map(el => {
            return {
              key: el.key,
              value: el.value !== undefined ? el.value : el.default,
              type: el.type
            };
          });
          // check if editable config item found, based on readonly property
          for (const el of this.categoryConfiguration.value) {
            if (!has(el, 'readonly') || el.readonly === 'false') {
              this.hasEditableConfigItems = true;
              break;
            } else {
              this.hasEditableConfigItems = false;
            }
          }
        }
      }
    }
  }

  public setEditorConfig(type: string) {
    const editorOptions = {
      theme: this.selectedTheme,
      mode: 'text/x-python',
      lineNumbers: true,
      lineWrapping: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
      autoCloseBrackets: true,
      matchBrackets: true,
      lint: true
    };
    if (type === 'JSON') {
        editorOptions.mode = 'application/json';
    }
    return editorOptions;
  }

  public saveConfiguration(form: NgForm) {
    this.isValidForm = true;
    if (!form.valid || !this.passwordMatched) {
      this.isValidForm = false;
      return;
    }

    if (this.passwordMatched) {
      this.passwordOnChangeFired = false;
      form.control.removeControl('confirm-password');
    }

    if (!this.isValidJson) {
      this.isValidJson = true;
      return;
    }

    const formData = Object.keys(form.value).map(key => {
      return {
        key: key,
        value: form.value[key] === null ? '0' : form.value[key].toString(),
        type: this.configItems.find(conf => key === conf.key).type
      };
    });
    const changedConfigValues = this.configItems.length > 0 ? differenceWith(formData, this.configItems, (newConfig, oldConfig) => {
      if (newConfig.type === 'JSON' && oldConfig.type === 'JSON') {
          return isEqual(JSON.parse(newConfig.value), JSON.parse(oldConfig.value));
      }
      return isEqual(newConfig, oldConfig);
    }) : [];

    this.filesToUpload = changedConfigValues.map((d) => {
      if (d.type === 'script') {
        return this.createFileToUpload(d);
      }
    }).filter(f => f !== undefined);
    // condition to check if called from wizard
    if (this.isWizardCall) {
      if (this.filesToUpload.length > 0) {
        changedConfigValues.push({ key: 'script', 'value': this.filesToUpload, 'type': 'script' });
      }
      this.onConfigChanged.emit(changedConfigValues);
      return;
    }
    if (changedConfigValues.length > 0) {
      this.updateConfiguration(this.categoryConfiguration.key, changedConfigValues);
    }
    if (this.filesToUpload.length > 0) {
      this.uploadScript();
    }
  }

  public checkValidJson(configValue) {
    try {
      JSON.parse(configValue);
      this.isValidJson = true;
      return true;
    } catch (e) {
      this.isValidJson = false;
      return false;
    }
  }

  public fileChange(event, configItem) {
    this.isFileUploaded = true;
    this.isValidExtension = true;
    const fileReader = new FileReader();
    const fi = event.target;
    if (fi.files && fi.files[0]) {
      const file = fi.files[0];
      this.newFileName = file.name;
      fileReader.onload = () => {
        this.fileContent = fileReader.result.toString();
      };
      fileReader.readAsText(file);
      const ext = file.name.substr(file.name.lastIndexOf('.') + 1);
      if (ext !== 'py') {
        this.isValidExtension = false;
      }
      this.filesToUpload.push({ [configItem]: file });
    }
  }

  updateConfiguration(categoryName: string, changedConfig: any) {
    if (categoryName === undefined) {
      return;
    }
    changedConfig = cloneDeep(changedConfig.map(el => {
      if (el.type.toUpperCase() !== 'SCRIPT') {
        if (el.type.toUpperCase() === 'JSON') {
          el.value = JSON.parse(el.value);
        }
        return {
          [el.key]: el.value !== undefined ? el.value : el.default,
        };
      }
    })).filter(e => e !== undefined);
    changedConfig = Object.assign({}, ...changedConfig); // merge all object into one
    if (isEmpty(changedConfig)) {
      return;
    }

    /** request started */
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(categoryName, changedConfig).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.', true);

          // fill configItems with changed data
          this.configItems = Object.keys(data).map(key => {
            return {
              key: key,
              value: data[key].value,
              type: data[key].type
            };
          });
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getConfigAttributeType(key) {
    return ConfigTypeValidation.getValueType(key);
  }

  /**
   * Method to set ngModal value
   * @param configVal Config value to pass in ngModel
   */
  public setConfigValue(configVal) {
    if (this.codeeditor !== undefined) {
      this.codeeditor.nativeElement.click();
    }
    if (configVal.value !== undefined) {
      return configVal.value;
    } else {
      return configVal.default;
    }
  }

  /**
   * Method to set isWizardCall = true if called from
   * add south or north wizard.
   */
  public callFromWizard() {
    this.isWizardCall = true;
  }

  public uploadScript() {
    this.filesToUpload.forEach(data => {
      let configItem: any;
      configItem = Object.keys(data)[0];
      const file = data[configItem];
      const formData = new FormData();
      formData.append('script', file);
      this.ngProgress.start();
      this.configService.uploadFile(this.categoryConfiguration.key, configItem, formData)
        .subscribe((content: any) => {
          this.filesToUpload = [];
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.', true);
          // fill configItems with changed data
          this.configItems.map(obj => {
            if (obj.key === content.type) {
              obj.value = content.value;
              obj.type = content.type;
            }
          });
        },
          error => {
            this.filesToUpload = [];
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    });
  }

  /**
   * Check if object has a specific key
   * @param o Object
   * @param name key name
   */
  public hasProperty(o, name) {
    return o.hasOwnProperty(name);
  }

  /**
   * display config item name on gui
   * @param configItem config item object
   */
  public setDisplayName(configItem) {
    if (this.hasProperty(configItem, 'displayName')) {
      return configItem.displayName.trim().length > 0 ? configItem.displayName : configItem.key;
    }
    return configItem.key;
  }

  public toggleDropdown(key) {
    const dropDown = document.querySelector('#' + key + '-dropdown');
    dropDown.classList.toggle('is-active');
  }

  public checkButtonProxy() {
    if (this.useProxy === 'false'
      && this.useFilterProxy === 'false'
      && this.useRuleProxy === 'false'
      && this.useDeliveryProxy === 'false') {
      return 'false';
    }
  }

  public getFileName(name: string) {
    this.oldFileName = name !== undefined ? name.substr(name.lastIndexOf('/') + 1) : this.oldFileName;
    if (this.oldFileName !== '') {
      this.isFileUploaded = true;
    }
    this.cdRef.detectChanges();
  }

  createFileToUpload(data: any) {
    const blob = new Blob([data.value], { type: 'plain/text' });
    const file = new File([blob], this.newFileName !== '' ?
      this.newFileName : this.oldFileName
        .replace(`${this.categoryConfiguration.key.toLowerCase()}_${data.key.toLowerCase()}_`, ''));
    return { script: file };
  }

  showConfirmPassword() {
    this.passwordOnChangeFired = true;
  }

  togglePassword(input: any): any {
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  checkPasswords(password: string, confirmPassword: string) {
    this.passwordMatched = true;
    if (password !== confirmPassword) {
      this.passwordMatched = false;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
