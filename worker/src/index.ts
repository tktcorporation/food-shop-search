import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { restaurantRoutes } from './routes/restaurants';
import { stationRoutes } from './routes/stations';
import { geocodeRoutes } from './routes/geocode';

type Bindings = {
  DB: D1Database;
  GOOGLE_MAPS_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());
app.route('/api', restaurantRoutes);
app.route('/api', stationRoutes);
app.route('/api', geocodeRoutes);

export default app;
