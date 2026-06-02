import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { register } from '../../state/auth.actions';
import { selectLoading, selectError } from '../../state/auth.selectors';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterPageComponent implements OnInit {
  showPassword = false;
  showConfirmPassword = false;
  confirmPassword = '';
  passwordMismatch = false;
  accountType: 'client' | 'company' = 'client';

  formData = {
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    companyName: '',
  };

  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  @Output() close = new EventEmitter<void>();

  constructor(
    private store: Store,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  checkPasswordMatch() {
    this.passwordMismatch = this.formData.password !== this.confirmPassword;
  }


  onSubmit(form: NgForm): void {
    if (form.invalid || this.passwordMismatch) {
      form.control.markAllAsTouched();
      this.notificationService.error('Please correct form errors before submitting.');
      return;
    }

    const { username, email, password, phone, address, companyName } =
      this.formData;
    const userData =
      this.accountType === 'company'
        ? { username, email, password, phone, address, companyName }
        : { username, email, password, phone, address };

    this.store.dispatch(register({ userData, userType: this.accountType }));
  }

  closeModal() {
    this.close.emit();
  }
}
