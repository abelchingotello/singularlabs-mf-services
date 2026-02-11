import { Directive, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[digitsOnly]'
})
export class DigitsOnlyDirective {
  constructor(@Optional() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = String(input.value || '').replace(/\D+/g, '');
    if (filtered === input.value) {
      return;
    }

    input.value = filtered;
    if (this.ngControl?.control) {
      // Keep the reactive form value clean.
      this.ngControl.control.setValue(filtered, { emitEvent: false });
    }
  }
}
