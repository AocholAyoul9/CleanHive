import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { login } from '../../state/auth.actions';
import { selectLoading, selectError } from '../../state/auth.selectors';
import { NotificationService } from '../../../../core/services/notification.service';
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPageComponent implements OnInit {
  loginData = {
    email: '',
    password: '',
    userType: 'client' as 'client' | 'company' | 'employee',
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

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.notificationService.error('Please complete required fields before submitting.');
      return;
    }

    const { email, password, userType } = this.loginData;

    this.store.dispatch(login({ email, password, userType }));
  }

  closeModal() {
    this.close.emit();
  }
}
