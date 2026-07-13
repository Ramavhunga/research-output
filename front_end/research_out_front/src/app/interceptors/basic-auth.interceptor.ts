import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../environment/environment-url';
import { LoginService } from '../services/login.service';

const isBackendApiRequest = (url: string): boolean => url.startsWith(environment.apiUrl);

export const basicAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isBackendApiRequest(request.url) || request.headers.has('Authorization')) {
    return next(request);
  }

  const loginService = inject(LoginService);
  const authHeader = loginService.getStoredBasicAuthorization();
  if (!authHeader) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: authHeader }
  }));
};

