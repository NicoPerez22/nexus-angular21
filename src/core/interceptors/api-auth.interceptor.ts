import { HttpInterceptorFn } from "@angular/common/http";
import { API_BASE_URL } from "../config/api.config";

export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url.startsWith("/api/");
  if (isApiRequest) {
    request = request.clone({ url: `${API_BASE_URL}${request.url}` });
  }
  const token = sessionStorage.getItem("hacha.auth.token");
  if (!token || !isApiRequest) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};