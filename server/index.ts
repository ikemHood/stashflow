import { serve } from 'bun';
import api from './src/routes';
import { swagger } from './src/swagger';
import { setupRolesAndPermissions } from './src/utils/setupRolesAndPermissions';
import { setupTokens } from './src/utils/setupTokens';
import { pinoLogger } from './src/middleware/logger';
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";

const PORT = process.env.PORT || 3000;

// Initialize the roles and permissions
const initializeApp = async () => {
    try {
        if (process.env.PERFORM_SETUP === 'true') {
            // Set up initial roles and permissions
            await setupRolesAndPermissions();

            // Set up system tokens
            await setupTokens();
        }

        // Set up logger
        api.use(pinoLogger())
            .use(serveEmojiFavicon("📝"))
            .notFound(notFound)
            .onError(onError);

        // Add Swagger UI to the API
        api.get('/api-docs/swagger.json', (c) => c.json(swagger.doc));
        api.get('/api-docs', swagger.ui);

        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);

        serve({
            port: PORT,
            fetch: api.fetch,
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// Start the application
initializeApp();