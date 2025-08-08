import { HttpResponse } from '../../core/helpers/http.helper.js';
import { UserValidationException } from './exceptions/user.exceptions';

export function getListUser(req) {
  const { page, limit } = req.query;

  console.log(req.query);
  console.log(req.body);
  console.log(req.params);

  if (page < 1) {
    throw new UserValidationException('page', page, 'must be greater than 0');
  }

  if (limit < 1) {
    throw new UserValidationException('limit', limit, 'must be greater than 0');
  }

  return HttpResponse.paginated([], { page, limit }, 'Oki');
}
