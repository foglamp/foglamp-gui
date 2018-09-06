import { Pipe, PipeTransform } from '@angular/core';

import { format } from 'date-fns';


/*
 * Time helper using date-fns
*/
@Pipe({name: 'dateparser'})
export class MomentDatePipe implements PipeTransform { // TODO: rename to DateFormatterPipe
  transform(value: string, formatter: string): string {
      if (value !== '') {
        return format(value, formatter);
      } else {
        return value;
      }
  }
}
