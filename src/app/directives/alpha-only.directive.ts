import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appAlphabetsOnly]'
})
export class AlphabetsOnlyDirective {

  constructor() { }

  @HostListener('keypress') onkeypress(e) {
    const event = e || window.event;
    if (event) {
      return this.isAlphabetKey(event);
    }
  }

  isAlphabetKey(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 65 || charCode > 90) && (charCode < 97 || charCode > 122)) {
      return false;
    }
    return true;
  }
}
