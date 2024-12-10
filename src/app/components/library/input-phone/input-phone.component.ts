import { Component, ContentChild, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import * as libphonenumber from 'awesome-phonenumber';
import { ISO_3166_1_CODES } from './country-codes';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormGroupDirective, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'uni-input-phone',
  standalone: true, // Marcar el componente como standalone
  templateUrl: './input-phone.component.html',
  styleUrls: ['./input-phone.component.scss'],
  imports: [
    CommonModule, // Necesario para las directivas como *ngFor y *ngIf
    ReactiveFormsModule, // Necesario para los formularios reactivos
    MatCardModule, // Angular Material card
    MatDividerModule, // Angular Material divider
    MatFormFieldModule, // Angular Material form fields
    MatSelectModule, // Angular Material select
    MatInputModule, // Angular Material input
    OverlayModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class InputPhoneComponent implements OnInit {

  @Output() phoneChanged = new EventEmitter<any>();
  @Input() disabled?: boolean;
  @Input() viewButton: boolean = false;
  @Input() acceptMobileOnly: boolean = false;
  @Output() clickButton = new EventEmitter<void>();
  @Input() value: string = '';

  countyCodes = ISO_3166_1_CODES;

  profileForm = this.fb.group({
    phone: this.fb.group({
      country: [{ value: 'PE', disabled: true }, Validators.required],
      number: ['']
    }, { validators: phoneValidator(this.acceptMobileOnly) })
  });

  phoneErrorMatcher = new PhoneErrorMatcher();

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.updateValidator();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && changes['value'].currentValue !== changes['value'].previousValue) {
      this.updatePhoneNumber(); // Llama solo si el valor realmente cambia
    }
  }

  private updatePhoneNumber() {
    if (this.value) {
      const parsedPhone = libphonenumber.parsePhoneNumber(this.value);

      // Evita sobrescribir si los valores ya coinciden
      if (this.phoneCountryControl.value !== parsedPhone.regionCode) {
        this.phoneCountryControl.setValue(parsedPhone.regionCode);
      }
      if (this.phoneNumberControl.value !== parsedPhone.number.national) {
        this.phoneNumberControl.setValue(parsedPhone.number.national);
      }
    } else {
      // // Limpia solo si el campo no está vacío
      // if (this.phoneNumberControl.value) {
      //   this.phoneNumberControl.setValue('');
      // }
    }
  }



  //Eliminar espacio en blanco
  get phoneNumberDigits(): string {
    return this.phoneNumberControl.value?.replace(/\D/g, '') || '';
  }

  private updateValidator() {
    const phoneGroup = this.profileForm.get('phone');
    phoneGroup?.setValidators(phoneValidator(this.acceptMobileOnly));
    phoneGroup?.updateValueAndValidity();
  }

  //Generar un json con las validaciones correspondientes
  get phoneNumber(): libphonenumber.ParsedPhoneNumber {
    return libphonenumber.parsePhoneNumber(this.phoneNumberDigits, { regionCode: this.phoneCountryControl.value });
  }

  //Exponer el formato nacional, sin codigo de pais
  formatNumber() {
    const natNum = this.phoneNumber.number?.national;
    this.phoneNumberControl.setValue(natNum || this.phoneNumberDigits);
    // console.log(this.phoneNumber);
    this.phoneChanged.emit(this.phoneNumber);
  }

  //Crear ejemplo con el pais seleccionado y tipo mobile
  get phoneHint(): string {
    return libphonenumber.getExample(this.phoneCountryControl.value, 'mobile')?.number.national || '';
  }

  //Formato sin espacios y codigo de pais
  get phoneE164(): string {
    return this.phoneNumber.number.e164 || '';
  }

  get phoneGroup(): AbstractControl {
    return this.profileForm.get('phone') as AbstractControl;
  }

  get phoneCountryControl(): AbstractControl {
    return this.profileForm.get('phone.country') as AbstractControl;
  }

  get phoneNumberControl(): AbstractControl {
    return this.profileForm.get('phone.number') as AbstractControl;
  }

  onSuffixButtonClick() {
    this.clickButton.emit();  // Emitir el evento si se desea manejar en el componente padre
  }
}

export function phoneValidator(acceptMobileOnly: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const country = control.get('country');
    const num = control.get('number');
    if (num?.value && country?.value && !(libphonenumber.parsePhoneNumber(num.value, { regionCode: country.value }).valid)) {
      return { invalidPhone: true };
    }

    if (acceptMobileOnly && (libphonenumber.parsePhoneNumber(num.value, { regionCode: country.value }).type !== 'mobile')) {
      return { notMobile: true };
    }
    return null;
  };
}

export class PhoneErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.value && control?.touched && control?.parent && !control.parent.valid);
  }
}
