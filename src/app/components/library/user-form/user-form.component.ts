import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyService } from 'src/app/services/company.service';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { SpinnerService } from 'src/app/services/spinner.service';
import { UserService } from 'src/app/services/user.service';
import { v4 as uuidv4 } from 'uuid';
import { InputPhoneComponent } from '../input-phone/input-phone.component';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    InputPhoneComponent,
    MatCardModule,
    MatCheckboxModule
  ],
})
export class UserFormComponent implements OnInit {

  public formUser!: FormGroup;
  public checked = true;
  public indeterminate = false;
  public REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  public title: string = 'Nuevo Usuario'
  public idUser: string;
  public formTrue: boolean;
  public docName: string = 'Razón Social';
  public documentMaxLenght: number;
  public companyID: string;
  public createdBy: string;
  public saveEdit: boolean;
  public stateMaster: any;
  public roleMaster: any;
  public listRole: any[] = [];
  public dataUserID: any
  public statusUser: string
  public email_verify: boolean = false
  public phone_verify: boolean = false

  constructor(
    private form: FormBuilder,
    private mytoastr: MytoastrService,
    // private userService: UserService,
    private spinner: SpinnerService,
    private companyService: CompanyService,
    private authService: AuthService,
    private masterService: MasterService

  ) { }

  ngOnInit(): void {
    this.formNewUsers();
    this.email_verif.disable();
    this.phone_verif.disable();
    if (this.idUser) {
      this.title = 'Editar Usuario';
      // this.getUserId();
      // this.saveEdit = true;  
      console.log(this.typeDoc.value)

    }
    console.log("ID REGISTRO", this.idUser)
    this.companyID = this.companyService.getCompanyId();
    console.log("compñia", this.companyID)
    this.createdBy = this.authService.getUserId();
    console.log("createdBy", this.createdBy)
    if (this.idUser) {
      this.user_status.enable();
    } else {
      this.user_status.disable();
    }

    this.onSelectDocumentType(this.typeDoc)
    // TRAER ESTADOS
    this.masterService.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      }
    });

    this.masterService.getItemsMasterTable(4).subscribe({
      next: (role) => {
        this.roleMaster = role;
        console.log("ROLES", role)
      }
    });
  }

  formNewUsers() {
    this.formUser = this.form.group({
      person_id: [''],
      person_firstName: ['', [Validators.required]],
      person_lastName: ['', [Validators.required]],
      email: ['', [Validators.email,Validators.required, Validators.pattern(this.REGEX_EMAIL)]],
      person_phone: [''],
      person_docType: this.form.group({
        nametype: ['DNI', [Validators.required]],
      }),
      person_docNumber: ['', [Validators.required]],
      gender: this.form.group({
        type_gen: ['', [Validators.required]],
      }),
      ubigeo: ['', [Validators.required]],
      name: ['', [Validators.required]],
      role: [''],
      auth: "register",
      fullname: [''],
      person_createdDate: [''],
      user_status: ['ACTIVE', [Validators.required]],
      verify_phone: this.phone_verify,
      verify_email: this.email_verify
    })
  }

  onSelectDocumentType(event: any) {
    const name = event.value;
    console.log("type", this.typeDoc.value)
    if (name === 'RUC') {
      this.formTrue = false
      this.numDoc.setValue('')
      this.name.setValue('')
      this.email.setValue('')
      this.phone.setValue('')
      this.user.setValue('')
      this.name.disable();
      this.gender.disable();
      this.ubigeo.disable();
      this.documentMaxLenght = 11
      console.log("documentolenght", this.documentMaxLenght)
      this.docName = 'Razón Social';
    } else {
      this.formTrue = true
      this.numDoc.setValue('')
      this.name.setValue('')
      this.email.setValue('')
      this.phone.setValue('')
      this.user.setValue('')
      this.name.enable();
      this.gender.enable();
      this.ubigeo.enable();
      this.documentMaxLenght = 8
      console.log("documentolenght", this.documentMaxLenght)
      this.docName = 'Apellidos';
    }
  }

  typeDocRuc() {
    this.name.disable();
    this.gender.disable();
    this.ubigeo.disable();
    this.documentMaxLenght = 11
  }

  onChangeEmailMasterAdmin() {
    const mail = this.email.value
    this.user.setValue(mail.split('@')[0]);
    //validacion para activar el checkout para verificación
    if(!this.email.errors){
      this.email_verif.enable();
    } else {
      this.email_verif.disable();
    }
    if(!this.email.value) this.email_verif.disable()
  }

  validateOnlyNumber1(event: any) {
    return this.validateOnlyNumber(event);
  }

  // Sólo números al pegar
  onPasteOnlyNumber(event: ClipboardEvent) {
    let valor = event.clipboardData?.getData('text');
    let respt = this.validateNumeric(valor);
    if (respt === false) event.preventDefault();
  }

  validateOnlyNumber(num: any) {
    // console.log("numero de doc",num)
    const numberCodeASCII = num.keyCode;
    let centinel = false;
    if (numberCodeASCII >= 48 && numberCodeASCII <= 57) {
      centinel = true;
    }
    return centinel;
  }

  // Validar números
  validateNumeric(caracter: any) {
    const exprReg = /^[0-9]*$/; //pendiente en investigación
    if (exprReg.test(caracter))
      return true;

    return false;
  }

  nameMayusName(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.name.setValue(input.value);
  }

  nameMayus(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.person_lastName.setValue(input.value);
  }

  valueRole(event: any, role: any) {
    // this.listRole = [];
    console.log("role", role)
    if (event.isUserInput) {
      if (event.source.selected) {
        if (!this.listRole.includes(role.SK))
          this.listRole.push(role.SK)
      } else {
        let index = this.listRole.indexOf(role.SK)
        if (index > -1) {
          this.listRole.splice(index, 1) //remover rol seleccionado
          console.log("eliminado")
        }
      }
    }

    // console.log("evento de ROL",this.listRole)
  }


  update() {

    const formData = this.formUser.value;
    this.fullname.setValue(this.name.value + ' ' + this.person_lastName.value)

    //data para actualizar solo usuarios
    const dataUser = {
      user_email: formData.email,
      user_fullName: this.fullname.value,
      user_roles: this.listRole,
      user_status: this.user_status.value,
      user_nickname: formData.name,
      user_name: this.dataUserID.user_name,
      user_phone: this.phone.value,
      user_phone_verified:  formData.verify_phone || false,
      user_email_verified:  formData.verify_email || false
    }

    const dataPerson = {
      person_docNumber: this.numDoc.value,
      person_docType: this.typeDoc.value,
      person_firstName: formData.person_firstName || '',
      person_lastName: formData.person_lastName,
      person_phone: this.phone.value,
      person_gender: this.gender.value || '',
      person_ubigeo: this.ubigeo.value || ''
    }

    // console.log("DATOA ACTUALIZADOS USUARIOS", dataUser)
    // console.log("DATOA ACTUALIZADOS USUARIOS", this.listRole)
    // console.log("DATOA ACTUALIZADOS PERSONAS", dataPerson)
    // console.log("CUERPO DE LA PERSONA",this.dataUserID.user.person_id)

    // return

    // this.userService.updateUser(dataUser, this.idUser).subscribe({
    //   next: (response) => {
    //     this.mytoastr.showSuccess(response, '')
    //     this.userService.updatePerson(dataPerson, this.dataUserID.person_id).subscribe({
    //       next: (response) => {
    //         console.log(response)
    //       }
    //     })
    //   },
    //   error: (error) => {
    //     console.error(error)
    //     this.spinner.spinnerOnOff();
    //   },
    //   complete: () => {
    //     this.spinner.spinnerOnOff();
    //   }
    // })
  }

  saveUser() {
    this.spinner.spinnerOnOff();
    if (!this.formUser.valid) {

      console.log("formulario", this.formUser.value)
      this.mytoastr.showWarning("Ingrese datos en el formulario", '')
      this.spinner.spinnerOnOff();
      return;
    }

    if(this.email.value=='' && this.phone.value == ''){
      this.mytoastr.showWarning("Ingrese correo o celular para verificación", '')
      this.spinner.spinnerOnOff();
      return;
    }

    if(!this.email_verif.value && !this.phone_verif.value){
      this.mytoastr.showWarning("Seleccione un elemento de verificación", '')
      this.spinner.spinnerOnOff();
      return;
    }

    // this.router.navigate(["/users"])
    // return

    // console.log("LISTA PARA ENVIAR ROLES",this.listRole)

    //  return
    if (!this.idUser) {
      console.log("ingreso para guardar")
      const formData = this.formUser.value;
      this.fullname.setValue(this.name.value + ' ' + this.person_lastName.value);
      this.person_id.setValue(uuidv4()) // id para validacion en el backend
      // console.log("LISTA usuario", this.listRole)
      // return

      // Crear el objeto que se enviará al backend
      const requestBody = {
        person_docType: formData.person_docType.nametype,
        person_firstName: formData.person_firstName || '',
        person_lastName: formData.person_lastName,
        email: formData.email,
        person_phone: formData.person_phone,
        person_docNumber: formData.person_docNumber,
        ubigeo: formData.ubigeo || '',
        name: formData.name,
        auth: "register",
        person_createdDate: "",
        user_id: "",
        user_phone_verified:  formData.verify_phone || false,
        user_email_verified:  formData.verify_email || false
      };

      const payload = {
        ...requestBody,             // Incluye los datos del formulario
        fullname: this.fullname.value,
        person_id: this.person_id.value,
        role: this.listRole,
        user_status: this.user_status.value,
        gender: this.gender.value,
        companyId: this.companyID,
        createdBy: this.createdBy,
      };
      // console.log("formulario", this.formUser.value)
      // console.log("VALIDAR EMAIL",this.email_verif )
      // console.log("VALIDAR CELULAR ",this.phone_verif )
      console.log("ENVIAR", (payload))

      let respuesta: any;
      // return
      // this.userService.postUser(payload).subscribe(
      //   {
      //     next: (response) => {
      //       respuesta = response
      //       console.log('Registro exitoso:', response);
      //       if (response.statusCode == 409) {
      //         this.mytoastr.showWarning(response.message, '')
      //         return;
      //       }
      //       this.mytoastr.showSuccess('Registro exitoso', '')
      //       // this.router.navigate(["/users"])
      //     },
      //     error: (error) => {
      //       this.mytoastr.showError('Intente nuevamente en unos momentos', '')
      //       console.error('Otro error ocurrió:', error);
      //     },
      //     complete: () => {
      //       console.log("ingreso")
      //       this.spinner.spinnerOnOff();
      //     }
      //   }

      // )
    } else {
      this.update();
      console.log("ingreso actualizar")
    }
  }

  // getUserId() {

  //   this.spinner.spinnerOnOff();
  //   this.userService.getUsersId(this.idUser).subscribe({
  //     next: (res) => {
  //       this.dataUserID = res;
  //       console.log("data", res)
  //       this.email.setValue(res.user_email);
  //       this.user.setValue(res.user_nickname);
  //       this.user_status.setValue(res.user_status);
  //       this.phone.setValue(res.user_phone)
  //       if(this.phone.value) this.phone_verif.enable();
  //       this.email_verif.setValue(res.user_email_verified);
  //       if(this.email_verif.value) this.email_verif.enable();
  //       this.phone_verif.setValue(res.user_phone_verified);
  //       // if(this.phone_verif.value) this.phone_verif.enable();
  //       if (this.user_status.value == 'BLOCKED') {
  //         this.user_status.disable();
  //       }
  //       this.listRole = res.user_roles.map((role: any) => role.role_id);
  //       this.formUser.patchValue({
  //         role: this.listRole
  //       })
  //       // this.userService.getPersonId(res.person_id).subscribe({
  //       //   next: (person) => {
  //       //     console.log("dataPersona", person)
  //       //     if (person.contact.person_docType == 'RUC') {
  //       //       this.formTrue = false;
  //       //       this.docName = 'Razón Social';
  //       //       this.numDoc.setValue(person.contact.person_docNumber)
  //       //       this.typeDoc.setValue(person.contact.person_docType)
  //       //       if (this.typeDoc.value == 'RUC') {
  //       //         this.typeDocRuc();
  //       //         console.log("tipoDOC", this.typeDoc.value)
  //       //       }
  //       //       // this.phone.setValue(person.contact.person_phone);
  //       //       this.person_lastName.setValue(person.contact.person_lastName)
  //       //     } else {
  //       //       this.name.setValue(person.contact.person_firstName)
  //       //       this.person_lastName.setValue(person.contact.person_lastName)
  //       //       // this.phone.setValue(person.contact.person_phone)
              
  //       //       console.log("CELULAR--",this.phone.value)
  //       //       this.numDoc.setValue(person.contact.person_docNumber)
  //       //       this.ubigeo.setValue(person.contact.person_ubigeo)
  //       //       this.gender.setValue(person.contact.person_gender)
  //       //     }
  //       //   },
  //       //   error: (error) => {
  //       //     console.error('Ocurrió un error:', error);
  //       //   },
  //       //   complete: () => {
  //       //     this.spinner.spinnerOnOff();
  //       //   }
  //       // })

  //     },
  //     error: (err) => {
  //       console.log("error", err)
  //     },
  //     complete: () => {
  //       // this.spinner.spinnerOnOff();
  //     }
  //   })
  // }

  onPhoneChange(phoneData: any) {
    if (phoneData.valid && phoneData.typeIsMobile) {
      this.phone_verif.enable();
      this.phone.setValue(phoneData.number.e164)
      // console.log("phone:",phoneData)
    } else {
      this.phone_verif.disable();
      this.phone.setValue(null);
    }
    // console.log("NUMERO DE CELULAR", this.phone.value)
  }

  getUserByTypeDocAndDoc() {
    console.log("ingreso validar numeri")
    if (this.typeDoc.value == "RUC") {
      if (!this.numDoc.value.startsWith('10') && !this.numDoc.value.startsWith('20')) {
        this.mytoastr.showWarning("Ingrese número valido", '')
        this.numDoc.reset();
      }
    }
  }

  //  Letras y carácteres especiales al pegar
  onPasteOnlyLetterAndSpecial(event: ClipboardEvent) {
    let valor = event.clipboardData?.getData('text');
    let respt = this.validateOnlyLetterAndSpecial(valor);
    if (respt === false) event.preventDefault();
  }

  // Letras y carácteres especiales al escibir
  validateOnlyLetter(event: any) {
    return this.validateOnlyLetterAndSpecial(event.key);
  }

  // Para validar letras y caracteres especiales
  validateOnlyLetterAndSpecial(caracter: any) {
    const exprReg = /^[a-zA-Z_áéíóúäëïöüÁÉÍÓÚñÑÄËÏÖÜ".,'`-\s]*$/;
    if (exprReg.test(caracter)) return true;
    return false;
  }

  onKeyPress(event: KeyboardEvent): void {
    const char = event.key; // Obtiene el carácter presionado
    const exprReg = /^[a-zA-Z0-9]*$/; // Solo letras y números
    if (!exprReg.test(char)) {
      event.preventDefault(); // Evita que se ingrese caracteres no válidos
    }
  }


  get id_user() {
    return this.formUser.get('id')
  }
  get name() {
    return this.formUser.get('person_firstName')
  }
  get person_lastName() {
    return this.formUser.get('person_lastName')
  }
  get email() {
    return this.formUser.get('email')
  }
  get phone() {
    return this.formUser.get('person_phone')
  }
  get typeDoc() {
    return this.formUser.get('person_docType.nametype')
  }
  get numDoc() {
    return this.formUser.get('person_docNumber')
  }
  get gender() {
    return this.formUser.get('gender.type_gen')
  }
  get ubigeo() {
    return this.formUser.get('ubigeo')
  }
  get user() {
    return this.formUser.get('name')
  }

  get fullname() {
    return this.formUser.get('fullname')
  }

  get person_id() {
    return this.formUser.get('person_id')
  }

  get user_status() {
    return this.formUser.get('user_status')
  }
  get email_verif() {
    return this.formUser.get('verify_email')
  }
  get phone_verif() {
    return this.formUser.get('verify_phone')
  }

}
