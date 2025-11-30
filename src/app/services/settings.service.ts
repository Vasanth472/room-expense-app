import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private http: HttpClient) {}

  getFullAmount(): Observable<number> {
    return this.http.get<{ fullAmount: number }>('/api/settings/full-amount').pipe(
      map(r => (r && typeof r.fullAmount === 'number') ? r.fullAmount : 0),
      catchError(err => {
        console.error('Failed to load fullAmount setting', err);
        return of(0);
      })
    );
  }

  setFullAmount(amount: number) {
    return this.http.put<any>('/api/settings/full-amount', { fullAmount: amount });
  }
}
