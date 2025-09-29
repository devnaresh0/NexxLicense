import { Injectable } from '@angular/core';
                    import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  private showConfirmSubject = new BehaviorSubject<boolean>(false);
  private confirmResultSubject = new Subject<boolean>();

  showConfirm$: Observable<boolean> = this.showConfirmSubject.asObservable();
  private resolvePromise: ((value: boolean) => void) | null = null;

  async showConfirmation(): Promise<boolean> {
    // Create a new promise and store the resolve function
    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      this.showConfirmSubject.next(true);
    });
  }

  confirmLogout(confirm: boolean) {
    if (this.resolvePromise) {
      this.resolvePromise(confirm);
      this.resolvePromise = null;
    }
    this.showConfirmSubject.next(false);
  }
}
