/**
 * routes.ts — Hub central de rutas
 *
 * Cada dominio está modularizado en server/routes/*.routes.ts.
 * Este archivo solo monta los routers y devuelve el servidor HTTP.
 */
import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { setupAuth } from './localAuth';

import { registerAuthRoutes }     from './routes/auth.routes';
import { registerAdminRoutes }    from './routes/admin.routes';
import { registerCompanyRoutes }  from './routes/companies.routes';
import { registerCrmRoutes }      from './routes/crm.routes';
import { registerInventoryRoutes} from './routes/inventory.routes';
import { registerCoreRoutes }     from './routes/core.routes';
import { registerDocumentRoutes } from './routes/documents.routes';
import { registerEventRoutes }    from './routes/events.routes';
import { registerBillingRoutes }  from './routes/billing.routes';
import { registerMemberRoutes }   from './routes/members.routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación (passport + sesión + login/logout)
  await setupAuth(app);

  // Montar rutas por dominio
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerCompanyRoutes(app);
  registerCrmRoutes(app);
  registerInventoryRoutes(app);
  registerCoreRoutes(app);
  registerDocumentRoutes(app);
  registerEventRoutes(app);
  registerBillingRoutes(app);
  registerMemberRoutes(app);

  return createServer(app);
}
