import { Component } from '@angular/core';
import * as data from '../../../../git-version.json';
import { version as appVersion } from '../../../../../package.json';

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html'
})

export class FooterComponent {
  public appVersion: string = appVersion;
  public git = data['default'];
}
