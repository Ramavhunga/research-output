import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoadingService } from '../services/loading.service';

const isApiRequest = (url: string): boolean => url.startsWith('http') || url.includes('/api/');

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url)) {
    return next(request);
  }

  const loadingService = inject(LoadingService);
  loadingService.show();

  return next(request).pipe(finalize(() => loadingService.hide()));
};

