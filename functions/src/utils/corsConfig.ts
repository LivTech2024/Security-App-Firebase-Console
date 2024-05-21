import cors from 'cors';

const allowedOrigins = [
  'https://www.tacttik.com',
  'http://localhost:5173',
  'http://192.168.50.90:3000',
];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed HTTP methods
  optionsSuccessStatus: 204, // Return a 204 status for preflight requests
  preflightContinue: false,
  credentials: true,
});

export const dynamicCorsMiddleware = (origin: string) =>
  cors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed HTTP methods
    optionsSuccessStatus: 204, // Return a 204 status for preflight requests
    preflightContinue: false,
    credentials: true,
  });
